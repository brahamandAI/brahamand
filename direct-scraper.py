import asyncio
import aiohttp
import os
from bs4 import BeautifulSoup
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import json
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection settings
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGO_DB_NAME", "news_db")
COLLECTION_NAME = os.environ.get("MONGO_COLLECTION", "articles")

# News sources configuration
NEWS_SOURCES = [
    {
        "name": "The Hindu",
        "url": "https://www.thehindu.com/news/national/",
        "article_selector": ".text-container, .story-card-news, .story-text, .title-card, ul.section-list li, ul.story-list li",
        "title_selector": "h2, h3, h1, .title, a",
        "link_selector": "a",
        "link_attribute": "href",
        "base_url": "https://www.thehindu.com"
    },
    {
        "name": "Times of India",
        "url": "https://timesofindia.indiatimes.com/india",
        "article_selector": ".card-container, .top-story, .stry-hd-title, .news-card, .w_tle, li.article, .news-card a, ul.news-list li, .latest-from-sec li, .list5 li",
        "title_selector": "h2, h3, h1, .title, figcaption, span, a",
        "link_selector": "a",
        "link_attribute": "href",
        "base_url": "https://timesofindia.indiatimes.com"
    },
    {
        "name": "NDTV",
        "url": "https://www.ndtv.com/india",
        "article_selector": ".newsHdng, .news_Itm, .new_storylising li, .story_list li, .lst_large li, .story_short_by_list li, article, .lisingNews, #ins_storylist li",
        "title_selector": "h2, h3, h1, .title, .headline, .newsHdng, a",
        "link_selector": "a",
        "link_attribute": "href",
        "base_url": ""  # NDTV uses absolute URLs
    },
    {
        "name": "ANI",
        "url": "https://www.aninews.in/news/national/",
        "article_selector": ".aniBox, .story-box, .news-post, .news-box, article, .news-box, .card-news, .breakingNewsItem, .story-box, .anylinktitle",
        "title_selector": "h2, h3, h1, .title, .heading, a",
        "link_selector": "a",
        "link_attribute": "href",
        "base_url": "https://www.aninews.in"
    },
    {
        "name": "Hindustan Times",
        "url": "https://www.hindustantimes.com/india-news",
        "article_selector": ".hdg3, article, .news-card, .storyList li, .cartHolder, .clickable, .media, .latestnews-txt, .random-tt ul li",
        "title_selector": "h2, h3, h1, .title, .headline, a",
        "link_selector": "a",
        "link_attribute": "href",
        "base_url": "https://www.hindustantimes.com"
    }
]

# User-Agent rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36"
]

async def scrape_news_source(session, source, client):
    try:
        logger.info(f"[+] Scraping {source['name']}...")
        
        # Get a random User-Agent
        from random import choice
        headers = {
            "User-Agent": choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://www.google.com/",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
        }
        
        # Perform the request with a longer timeout
        async with session.get(source["url"], headers=headers, timeout=60) as response:
            if response.status != 200:
                logger.error(f"[{source['name']}] Failed with status code: {response.status}")
                return []
                
            logger.info(f"[{source['name']}] Response status: {response.status}")
            html_content = await response.text()
            
        # Parse the HTML content
        soup = BeautifulSoup(html_content, "html.parser")
        articles = []
        
        # Look for article elements with all selectors
        for selector in source["article_selector"].split(", "):
            items = soup.select(selector)
            logger.info(f"[{source['name']}] Found {len(items)} items with selector '{selector}'")
            
            # Process each article
            for item in items:
                try:
                    # Extract title
                    title_element = None
                    for title_selector in source["title_selector"].split(", "):
                        title_element = item.select_one(title_selector)
                        if title_element and title_element.get_text().strip():
                            break
                    
                    if not title_element:
                        title_element = item
                    
                    # Extract link
                    link_element = None
                    for link_selector in source["link_selector"].split(", "):
                        link_element = item.select_one(link_selector) or item
                        if link_element and link_element.has_attr(source["link_attribute"]):
                            break
                    
                    # Clean and process the data
                    title = title_element.get_text().strip()
                    link = link_element.get(source["link_attribute"], "")
                    
                    # Clean up the link
                    if link and not link.startswith("http"):
                        link = f"{source['base_url']}{link}"
                    
                    # Create article entry if valid
                    if title and link and len(title) > 10 and "Test Article" not in title:  # Minimum title length
                        article = {
                            "title": title,
                            "link": link,
                            "source": source["name"],
                            "scraped_at": datetime.utcnow()
                        }
                        articles.append(article)
                except Exception as e:
                    logger.error(f"[{source['name']}] Error processing article: {e}")
                    continue
        
        # Remove duplicates
        unique_articles = []
        seen_links = set()
        seen_titles = set()
        
        for article in articles:
            if article["link"] not in seen_links and article["title"] not in seen_titles:
                seen_links.add(article["link"])
                seen_titles.add(article["title"])
                unique_articles.append(article)
        
        logger.info(f"[{source['name']}] Found {len(unique_articles)} unique articles")
        
        # Save to database if we have articles
        if unique_articles:
            db = client[DB_NAME]
            collection = db[COLLECTION_NAME]
            
            # Ensure unique index on link
            await collection.create_index("link", unique=True)
            
            try:
                result = await collection.insert_many(unique_articles, ordered=False)
                logger.info(f"[{source['name']}] Inserted {len(result.inserted_ids)} articles")
            except Exception as e:
                logger.info(f"[{source['name']}] Some articles already exist: {e}")
        
        return unique_articles
    except Exception as e:
        logger.error(f"[{source['name']}] Scraping failed: {e}")
        return []

async def scrape_all_sources():
    """Scrape all configured news sources."""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGO_URI)
        
        # Create an HTTP session
        async with aiohttp.ClientSession() as session:
            # Scrape each source
            tasks = []
            for source in NEWS_SOURCES:
                task = asyncio.create_task(scrape_news_source(session, source, client))
                tasks.append(task)
            
            # Wait for all tasks to complete
            all_results = await asyncio.gather(*tasks)
            
            # Combine all articles
            all_articles = []
            for articles in all_results:
                all_articles.extend(articles)
            
            logger.info(f"[+] Finished scraping. Total: {len(all_articles)} new articles")
            return all_articles
    except Exception as e:
        logger.error(f"[Error] scrape_all_sources failed: {e}")
        return []

async def main():
    logger.info("Starting news scraper...")
    await scrape_all_sources()
    logger.info("Scraping completed.")

if __name__ == "__main__":
    asyncio.run(main()) 
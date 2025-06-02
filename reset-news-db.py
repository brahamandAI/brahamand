from pymongo import MongoClient
from datetime import datetime

# MongoDB connection
uri = "mongodb+srv://avigupta1910:HQFhXznwogLX6zjA@clusterbrahamand.1zkd1vo.mongodb.net/?retryWrites=true&w=majority&appName=Clusterbrahamand"
client = MongoClient(uri)
db = client['news_db']
collection = db['news_articles']

# Clear existing articles
collection.delete_many({})

# Insert sample articles for each source
sample_articles = [
    {
        "title": "Sample Article from The Hindu",
        "content": "This is a sample article from The Hindu.",
        "source": "The Hindu",
        "link": "https://www.thehindu.com/sample",
        "scraped_at": datetime.utcnow()
    },
    {
        "title": "Sample Article from Times of India",
        "content": "This is a sample article from Times of India.",
        "source": "Times of India",
        "link": "https://timesofindia.indiatimes.com/sample",
        "scraped_at": datetime.utcnow()
    },
    {
        "title": "Sample Article from ANI",
        "content": "This is a sample article from ANI.",
        "source": "ANI",
        "link": "https://www.aninews.in/sample",
        "scraped_at": datetime.utcnow()
    }
]

# Insert sample articles
collection.insert_many(sample_articles)
print("Database reset complete. Sample articles inserted.") 
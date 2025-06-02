from pymongo import MongoClient
import json
from bson import ObjectId, json_util
from datetime import datetime

# Custom JSON encoder to handle MongoDB ObjectId and dates
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

# Connect to MongoDB
client = MongoClient('localhost', 27017)
db = client['news_db']
collection = db['articles']

# Get articles
articles = list(collection.find().sort("scraped_at", -1).limit(10))
print(f"Found {len(articles)} articles")

# Print each article
for i, article in enumerate(articles):
    print(f"\nArticle {i+1}:")
    # Try using json_util from bson to serialize
    try:
        print(json.dumps(article, cls=JSONEncoder, indent=2))
    except Exception as e:
        print(f"Error serializing article: {e}")
        print("Raw article data:")
        for key, value in article.items():
            print(f"  {key}: {type(value)} - {value}")

# Let's try to modify an article to make it more compatible
if articles:
    article = articles[0]
    # Convert the article's scraped_at to an ISO string
    article["scraped_at"] = article["scraped_at"].isoformat() if isinstance(article["scraped_at"], datetime) else article["scraped_at"]
    # Convert ObjectId to string
    article["_id"] = str(article["_id"]) if isinstance(article["_id"], ObjectId) else article["_id"]
    
    print("\nModified article:")
    print(json.dumps(article, indent=2))
    
    # Update this article in the database
    try:
        # Create a new version with ISO timestamp
        fixed_article = {
            "title": article["title"],
            "link": article["link"],
            "source": article["source"],
            "scraped_at": datetime.utcnow().isoformat()
        }
        
        # Insert a fixed article
        result = collection.insert_one(fixed_article)
        print(f"\nInserted fixed article with ID: {result.inserted_id}")
    except Exception as e:
        print(f"Error inserting fixed article: {e}") 
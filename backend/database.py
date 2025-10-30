from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List, Any
import os
from dotenv import load_dotenv

from models import StudentIn, StudentOut

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "questLog")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "Students")

client: Optional[AsyncIOMotorClient] = None
database: Optional[Any] = None

async def connect_to_mongo():
    global client, database
    print(f"Trying to connect to MongoDB at {MONGO_URI}")
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        database = client[DATABASE_NAME]
        
        #the first collection access will create if it does not exist
        await database[COLLECTION_NAME].find_one({})
        print("Connected to MongoDB")
    
    except Exception as e:
        raise ConnectionError(f"Failed to connect to MongoDB: {e}")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")
        
#CRUD Operations
async def add_student(student: StudentIn) -> StudentOut:
    if database is None:
        raise ConnectionError("Database connection is not established.")
    student_collection = database[COLLECTION_NAME]
    
    student_dict = student.model_dump(by_alias=True, exclude_none=True)
    result = await student_collection.insert_one(student_dict)
    new_document = await student_collection.find_one({"_id": result.inserted_id})
    if new_document and "_id" in new_document:
        new_document["_id"] = str(new_document["_id"])
    
    return StudentOut(**new_document)

async def get_all_students() -> List[StudentOut]:
    if database is None:
        raise ConnectionError("Database connection is not established.")
    student_collection = database[COLLECTION_NAME]
    
    cursor = student_collection.find()
    students_list = await cursor.to_list(length=1000)  # limit to 1000 for safety
    
    for student in students_list:
        if "_id" in student:
            student["_id"] = str(student["_id"])
    
    return [StudentOut(**student) for student in students_list]
    


from fastapi import FastAPI, HTTPException, status
from contextlib import asynccontextmanager

from config.models import StudentIn, StudentOut, StudentCollection
from config.database import connect_to_mongo, close_mongo_connection, add_student, get_all_students

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup and close connection on shutdown."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()
    
app = FastAPI(
    title="Student Management API",
    description="API for managing student records using FastAPI and MongoDB.",
    lifespan=lifespan
)

#api endpoints
@app.post(
    "/students/",
    response_model=StudentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new student",
)
async def create_student(student: StudentIn):
    try:
        new_student = await add_student(student)
        return new_student
    except ConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while adding the student: {e}",
        )

@app.get(
    "/students/",
    response_model=StudentCollection,
    summary="Get all students",
)
async def list_students():
    try:
        students = await get_all_students()
        return StudentCollection(students=students)
    except ConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving students: {e}",
        )
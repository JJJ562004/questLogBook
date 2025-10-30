from pydantic import BaseModel, Field

class Student(BaseModel):
    name: str = Field(..., title="Name of the student", max_length=100)
    age: int = Field(..., title="Age of the student", ge=0)
    grade: str = Field(..., title="Grade of the student", max_length=10)

class StudentIn(Student):
    """Base model for creating a new student."""
    pass

class StudentOut(Student):
    """Base model for returning student data."""
    _id: str

class StudentCollection(BaseModel):
    students: list[StudentOut] = Field(..., title="List of students")
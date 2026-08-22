# Import the declarative Base from your database setup
from app.db.database import Base

# Import all your models here so SQLAlchemy's metadata can discover them
from app.models.employee import Employee
from app.models.attendance import Attendance

# (Any future models you create like 'Department' or 'LeaveRequest' will be imported here too)
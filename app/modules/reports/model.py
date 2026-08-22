"""
The Reports module has NO tables of its own - deliberately.

Reports only READ and aggregate data that already exists:

    leave_requests   (yours)
    payroll          (yours)
    employees        (Person 1)
    attendance       (Person 1)

Creating a table here would duplicate someone else's data and let the two
copies drift apart. This file stays empty on purpose; it exists so the module
matches the folder structure the team agreed on.
"""

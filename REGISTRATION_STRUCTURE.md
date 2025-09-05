# New Registration System - Improved Data Structure

## 🎯 **Problem Solved**

The original design had children stored directly in the user document, which made lesson booking difficult because:
- No clear identifier for which student is taking the lesson
- Mixed data structure (user + children in same document)
- Hard to query and manage students separately

## 🏗️ **New Data Structure**

### **Collections:**

#### **1. `users` Collection**
```javascript
{
  _id: ObjectId("..."),
  firstName: "Anna",
  lastName: "Bērziņa", 
  email: "anna@example.com",
  passwordHash: "argon2_hash...",
  accountType: "children", // or "self"
  role: "user",
  active: true,
  phone: "+371 12345678",
  createdAt: Date,
  updatedAt: Date
}
```

#### **2. `students` Collection**
```javascript
// For self accounts (user themselves)
{
  _id: ObjectId("student_id_1"),
  userId: ObjectId("user_id"), // Links to users collection
  firstName: "Anna",
  lastName: "Bērziņa",
  age: null, // Not required for self
  grade: null, // Not required for self
  school: null,
  isSelf: true, // Flag indicating this is the user themselves
  createdAt: Date,
  updatedAt: Date
}

// For children accounts
{
  _id: ObjectId("student_id_2"),
  userId: ObjectId("user_id"), // Links to parent's user account
  firstName: "Jānis",
  lastName: "Bērziņš", // Uses parent's last name
  age: 12,
  grade: "6. klase",
  school: "Rīgas 1. vidusskola",
  isSelf: false, // Flag indicating this is a child
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 **How It Works**

### **Registration Process:**

#### **Self Account:**
1. **Create user** in `users` collection
2. **Create student** in `students` collection with `isSelf: true`
3. **Link** student to user via `userId`

#### **Parent Account:**
1. **Create user** in `users` collection  
2. **Create multiple students** in `students` collection with `isSelf: false`
3. **Link** all students to parent via `userId`

### **Lesson Booking:**

#### **For Self Accounts:**
- **Student ID**: The single student record with `isSelf: true`
- **Payer**: The user themselves
- **Booking**: `{ studentId: "student_id_1", userId: "user_id" }`

#### **For Parent Accounts:**
- **Student ID**: Any of the children's student records
- **Payer**: The parent user
- **Booking**: `{ studentId: "student_id_2", userId: "user_id" }`

## 🚀 **API Endpoints**

### **Registration:**
- `POST /api/register` - Creates user + students
- **Returns**: `{ userId, studentIds: [...] }`

### **User Management:**
- `GET /api/user-info?userId=...` - Get user info + student count
- `GET /api/students?userId=...` - Get all students for a user

### **Lesson Booking (Future):**
- `POST /api/bookings` - Book lesson for specific student
- **Body**: `{ studentId, teacherId, date, time, subject }`

## 📊 **Benefits**

### **1. Clear Separation:**
- **Users**: Account holders (parents or individuals)
- **Students**: People who take lessons (could be self or children)

### **2. Flexible Lesson Booking:**
- **Same identifier system** for both account types
- **Clear student selection** for parents
- **Easy to query** student information

### **3. Scalable:**
- **Easy to add/remove** students
- **Support for multiple children** per parent
- **Consistent data structure** for all students

### **4. Future Features:**
- **Student profiles** with grades, progress, etc.
- **Individual lesson history** per student
- **Parent can manage** multiple children easily

## 🎯 **Example Scenarios**

### **Scenario 1: Self Account**
```
User: Anna Bērziņa (anna@example.com)
Student: Anna Bērziņa (isSelf: true)
Lesson: Anna books lesson for herself
```

### **Scenario 2: Parent Account**
```
User: Māra Kalniņa (mara@example.com) 
Students: 
  - Jānis Kalniņš (age 12, grade 6)
  - Līva Kalniņa (age 10, grade 4)
Lesson: Māra books lesson for Jānis
```

## 🔧 **Implementation Status**

- ✅ **Registration API** - Creates users + students
- ✅ **Students API** - Lists students for a user
- ✅ **User Info API** - Gets user details + student count
- 🔄 **Lesson Booking** - Ready to implement with student IDs
- 🔄 **Frontend Integration** - Ready to show student selection

This new structure provides a **clean, scalable foundation** for lesson booking and student management! 🎉

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Lead = require('./src/models/Lead');
const Student = require('./src/models/Student');
const Task = require('./src/models/Task');
const Invoice = require('./src/models/Invoice');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data (except admin)
    await Lead.deleteMany({});
    await Student.deleteMany({});
    await Task.deleteMany({});
    await Invoice.deleteMany({});
    console.log('Cleared existing seed data');

    // Get admin user
    const admin = await User.findOne({ email: 'admin@agency.com' });
    if (!admin) {
      console.error('Admin user not found. Run: node seedAdmin.js first');
      process.exit(1);
    }

    // --- Leads ---
    const leads = await Lead.insertMany([
      { firstName: 'James', lastName: 'Wilson', email: 'james.wilson@email.com', phone: '+1-555-0101', source: 'facebook', status: 'new', interestedIn: 'MBA Program', country: 'USA', city: 'New York', createdBy: admin._id },
      { firstName: 'Emma', lastName: 'Brown', email: 'emma.brown@email.com', phone: '+1-555-0102', source: 'instagram', status: 'contacted', interestedIn: 'Computer Science', country: 'UK', city: 'London', createdBy: admin._id },
      { firstName: 'Liam', lastName: 'Johnson', email: 'liam.johnson@email.com', phone: '+1-555-0103', source: 'website', status: 'qualified', interestedIn: 'Data Science', country: 'Canada', city: 'Toronto', createdBy: admin._id },
      { firstName: 'Olivia', lastName: 'Davis', email: 'olivia.davis@email.com', phone: '+1-555-0104', source: 'referral', status: 'proposal', interestedIn: 'Business Administration', country: 'Australia', city: 'Sydney', createdBy: admin._id },
      { firstName: 'Noah', lastName: 'Miller', email: 'noah.miller@email.com', phone: '+1-555-0105', source: 'linkedin', status: 'negotiation', interestedIn: 'Engineering', country: 'USA', city: 'Chicago', createdBy: admin._id },
      { firstName: 'Sophia', lastName: 'Garcia', email: 'sophia.garcia@email.com', phone: '+1-555-0106', source: 'facebook', status: 'converted', interestedIn: 'Medicine', country: 'Spain', city: 'Madrid', convertedToStudent: true, createdBy: admin._id },
      { firstName: 'Mason', lastName: 'Martinez', email: 'mason.martinez@email.com', phone: '+1-555-0107', source: 'instagram', status: 'lost', interestedIn: 'Law', country: 'Mexico', city: 'Mexico City', createdBy: admin._id },
      { firstName: 'Ava', lastName: 'Anderson', email: 'ava.anderson@email.com', phone: '+1-555-0108', source: 'website', status: 'new', interestedIn: 'Psychology', country: 'USA', city: 'Los Angeles', createdBy: admin._id },
      { firstName: 'Ethan', lastName: 'Taylor', email: 'ethan.taylor@email.com', phone: '+1-555-0109', source: 'referral', status: 'contacted', interestedIn: 'Architecture', country: 'France', city: 'Paris', createdBy: admin._id },
      { firstName: 'Isabella', lastName: 'Thomas', email: 'isabella.thomas@email.com', phone: '+1-555-0110', source: 'linkedin', status: 'qualified', interestedIn: 'Marketing', country: 'Germany', city: 'Berlin', createdBy: admin._id },
    ]);
    console.log(`Created ${leads.length} leads`);

    // --- Students ---
    const hashedPass = await bcrypt.hash('student123', 10);
    const students = await Student.insertMany([
      { studentId: 'STU-001', firstName: 'Alice', lastName: 'Cooper', email: 'alice.cooper@student.com', password: hashedPass, phone: '+1-555-0201', program: 'MBA Program', status: 'active', gender: 'female', nationality: 'American', enrollmentDate: new Date('2024-09-01'), counsellor: admin._id, createdBy: admin._id },
      { studentId: 'STU-002', firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@student.com', password: hashedPass, phone: '+1-555-0202', program: 'Computer Science', status: 'active', gender: 'male', nationality: 'British', enrollmentDate: new Date('2024-09-01'), counsellor: admin._id, createdBy: admin._id },
      { studentId: 'STU-003', firstName: 'Carol', lastName: 'White', email: 'carol.white@student.com', password: hashedPass, phone: '+1-555-0203', program: 'Data Science', status: 'active', gender: 'female', nationality: 'Canadian', enrollmentDate: new Date('2024-01-15'), counsellor: admin._id, createdBy: admin._id },
      { studentId: 'STU-004', firstName: 'David', lastName: 'Lee', email: 'david.lee@student.com', password: hashedPass, phone: '+1-555-0204', program: 'Engineering', status: 'inactive', gender: 'male', nationality: 'Korean', enrollmentDate: new Date('2023-09-01'), counsellor: admin._id, createdBy: admin._id },
      { studentId: 'STU-005', firstName: 'Eva', lastName: 'Green', email: 'eva.green@student.com', password: hashedPass, phone: '+1-555-0205', program: 'Business Administration', status: 'graduated', gender: 'female', nationality: 'German', enrollmentDate: new Date('2022-09-01'), counsellor: admin._id, createdBy: admin._id },
    ]);
    console.log(`Created ${students.length} students`);

    // --- Tasks ---
    const tasks = await Task.insertMany([
      { title: 'Follow up with James Wilson', description: 'Call James regarding MBA program details', assignedTo: [admin._id], assignedBy: admin._id, priority: 'high', status: 'pending', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), category: 'lead_followup', relatedLead: leads[0]._id },
      { title: 'Send proposal to Olivia Davis', description: 'Prepare and send detailed program proposal', assignedTo: [admin._id], assignedBy: admin._id, priority: 'urgent', status: 'in_progress', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), category: 'lead_followup', relatedLead: leads[3]._id },
      { title: 'Review student documents for Alice', description: 'Review and verify submitted enrollment documents', assignedTo: [admin._id], assignedBy: admin._id, priority: 'medium', status: 'completed', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), completedDate: new Date(), category: 'documentation', relatedStudent: students[0]._id },
      { title: 'Schedule orientation for new students', description: 'Organize orientation program for Sep 2024 intake', assignedTo: [admin._id], assignedBy: admin._id, priority: 'high', status: 'pending', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), category: 'meeting' },
      { title: 'Update CRM records for Q1', description: 'Ensure all lead and student records are up to date', assignedTo: [admin._id], assignedBy: admin._id, priority: 'low', status: 'pending', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), category: 'other' },
      { title: 'Call Emma Brown for follow up', description: 'Discuss Computer Science program requirements', assignedTo: [admin._id], assignedBy: admin._id, priority: 'medium', status: 'in_progress', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), category: 'lead_followup', relatedLead: leads[1]._id },
      { title: 'Prepare invoices for active students', description: 'Generate Q2 invoices for all active students', assignedTo: [admin._id], assignedBy: admin._id, priority: 'high', status: 'completed', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), completedDate: new Date(), category: 'documentation' },
    ]);
    console.log(`Created ${tasks.length} tasks`);

    // --- Invoices ---
    const invoices = await Invoice.insertMany([
      {
        invoiceNumber: 'INV-2024-001',
        student: students[0]._id,
        invoiceDate: new Date('2024-09-01'),
        dueDate: new Date('2024-09-30'),
        items: [{ description: 'MBA Program - Semester 1', quantity: 1, unitPrice: 5000, amount: 5000 }],
        subtotal: 5000, tax: { rate: 0, amount: 0 }, total: 5000, paidAmount: 5000,
        status: 'paid', paymentMethod: 'bank_transfer', paymentDate: new Date('2024-09-05'),
        createdBy: admin._id
      },
      {
        invoiceNumber: 'INV-2024-002',
        student: students[1]._id,
        invoiceDate: new Date('2024-09-01'),
        dueDate: new Date('2024-09-30'),
        items: [{ description: 'Computer Science - Semester 1', quantity: 1, unitPrice: 4500, amount: 4500 }],
        subtotal: 4500, tax: { rate: 0, amount: 0 }, total: 4500, paidAmount: 4500,
        status: 'paid', paymentMethod: 'credit_card', paymentDate: new Date('2024-09-10'),
        createdBy: admin._id
      },
      {
        invoiceNumber: 'INV-2024-003',
        student: students[2]._id,
        invoiceDate: new Date('2024-09-15'),
        dueDate: new Date('2024-10-15'),
        items: [{ description: 'Data Science - Semester 1', quantity: 1, unitPrice: 4800, amount: 4800 }],
        subtotal: 4800, tax: { rate: 0, amount: 0 }, total: 4800, paidAmount: 0,
        status: 'sent', createdBy: admin._id
      },
      {
        invoiceNumber: 'INV-2024-004',
        student: students[0]._id,
        invoiceDate: new Date('2025-01-01'),
        dueDate: new Date('2025-01-31'),
        items: [{ description: 'MBA Program - Semester 2', quantity: 1, unitPrice: 5000, amount: 5000 }],
        subtotal: 5000, tax: { rate: 0, amount: 0 }, total: 5000, paidAmount: 5000,
        status: 'paid', paymentMethod: 'bank_transfer', paymentDate: new Date('2025-01-08'),
        createdBy: admin._id
      },
      {
        invoiceNumber: 'INV-2024-005',
        student: students[3]._id,
        invoiceDate: new Date('2025-02-01'),
        dueDate: new Date('2025-02-28'),
        items: [{ description: 'Engineering - Semester 2', quantity: 1, unitPrice: 5500, amount: 5500 }],
        subtotal: 5500, tax: { rate: 0, amount: 0 }, total: 5500, paidAmount: 2750,
        status: 'partially_paid', paymentMethod: 'cash', paymentDate: new Date('2025-02-10'),
        createdBy: admin._id
      },
    ]);
    console.log(`Created ${invoices.length} invoices`);

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Leads:    ${leads.length}`);
    console.log(`Students: ${students.length}`);
    console.log(`Tasks:    ${tasks.length}`);
    console.log(`Invoices: ${invoices.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();

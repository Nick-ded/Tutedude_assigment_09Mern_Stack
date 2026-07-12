// seeder.js - this script adds test data to the database
// run with: node seeder.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import Visitor from './models/Visitor.js'
import Appointment from './models/Appointment.js'
import Pass from './models/Pass.js'
import CheckLog from './models/CheckLog.js'
import connectDB from './config/db.js'
import crypto from 'crypto'

dotenv.config()
connectDB()

// i learned that insertMany skips the pre-save hook so passwords dont get hashed
// so i need to hash manually before inserting - took me a while to figure this out lol

async function seedData() {
  try {
    // clear everything first
    await User.deleteMany()
    await Visitor.deleteMany()
    await Appointment.deleteMany()
    await Pass.deleteMany()
    await CheckLog.deleteMany()
    console.log('cleared old data')

    // hash the password once, reuse for all users
    const pw = await bcrypt.hash('password123', 10)

    const users = await User.insertMany([
      { name: 'Admin User', email: 'admin@example.com', password: pw, role: 'Admin' },
      { name: 'Security Guard', email: 'security@example.com', password: pw, role: 'Security' },
      { name: 'John Employee', email: 'john@example.com', password: pw, role: 'Employee' },
      { name: 'Sarah Manager', email: 'sarah@example.com', password: pw, role: 'Employee' },
    ])

    console.log('users added:', users.length)

    const visitors = await Visitor.insertMany([
      { name: 'Alice Johnson', email: 'alice@acme.com', phone: '9876543210', company: 'Acme Corp' },
      { name: 'Bob Williams', email: 'bob@techco.com', phone: '9123456789', company: 'TechCo' },
      { name: 'Charlie Brown', email: 'charlie@mail.com', phone: '8001234567', company: 'Brown Co' },
      { name: 'Diana Prince', email: 'diana@star.com', phone: '7009876543', company: 'Star Industries' },
      { name: 'Eve Turner', email: 'eve@freelance.io', phone: '6005551234', company: '' },
    ])

    console.log('visitors added:', visitors.length)

    // find the admin and john from the users array
    const admin = users[0]
    const john = users[2]
    const sarah = users[3]

    // create some appointments with different statuses for testing
    const now = new Date()
    
    const appointments = await Appointment.insertMany([
      {
        host: john._id,
        visitor: visitors[0]._id,
        purpose: 'Quarterly business review',
        expectedDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2hrs from now
        status: 'Approved',
      },
      {
        host: sarah._id,
        visitor: visitors[1]._id,
        purpose: 'Product demo',
        expectedDate: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        status: 'Pending',
      },
      {
        host: admin._id,
        visitor: visitors[2]._id,
        purpose: 'IT audit',
        expectedDate: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        status: 'Approved',
      },
      {
        host: john._id,
        visitor: visitors[3]._id,
        purpose: 'Contract meeting',
        expectedDate: new Date(now.getTime() + 26 * 60 * 60 * 1000), // tomorrow
        status: 'Pending',
      },
      {
        host: sarah._id,
        visitor: visitors[4]._id,
        purpose: 'Interview',
        expectedDate: new Date(now.getTime() - 20 * 60 * 60 * 1000), // yesterday
        status: 'Rejected',
      },
    ])

    console.log('appointments added:', appointments.length)

    // create passes only for approved appointments
    const approvedOnes = appointments.filter(a => a.status === 'Approved')
    
    const passes = []
    for (const apt of approvedOnes) {
      const p = await Pass.create({
        appointment: apt._id,
        qrCodeData: crypto.randomBytes(20).toString('hex'),
        validFrom: apt.expectedDate,
        validUntil: new Date(apt.expectedDate.getTime() + 24 * 60 * 60 * 1000),
        status: 'Active',
      })
      passes.push(p)
    }

    console.log('passes created:', passes.length)

    // add one checkin log for testing the scanner
    const securityUser = users[1]
    if (passes.length > 0) {
      await CheckLog.create({
        pass: passes[0]._id,
        securityPersonnel: securityUser._id,
        checkInTime: new Date(now.getTime() - 30 * 60 * 1000),
      })
      console.log('checkin log added')
    }

    console.log('\nDone! Login credentials:')
    console.log('admin@example.com / password123')
    console.log('security@example.com / password123')
    console.log('john@example.com / password123')
    console.log('sarah@example.com / password123')
    
    process.exit(0)
  } catch (err) {
    console.error('seeder error:', err)
    process.exit(1)
  }
}

seedData()

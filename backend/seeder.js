import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from './models/User.js';
import Visitor from './models/Visitor.js';
import Appointment from './models/Appointment.js';
import Pass from './models/Pass.js';
import CheckLog from './models/CheckLog.js';
import connectDB from './config/db.js';

dotenv.config();
await connectDB();

const importData = async () => {
  try {
    // Clear all collections
    await Promise.all([
      User.deleteMany(),
      Visitor.deleteMany(),
      Appointment.deleteMany(),
      Pass.deleteMany(),
      CheckLog.deleteMany(),
    ]);

    // ── Users ──────────────────────────────────────────────
    const hashed = await bcrypt.hash('password', 10);

    const [admin, security, john, sarah] = await User.insertMany([
      { name: 'Admin User',      email: 'admin@example.com',    password: hashed, role: 'Admin' },
      { name: 'Security Guard',  email: 'security@example.com', password: hashed, role: 'Security' },
      { name: 'John Employee',   email: 'john@example.com',     password: hashed, role: 'Employee' },
      { name: 'Sarah Manager',   email: 'sarah@example.com',    password: hashed, role: 'Employee' },
    ]);

    // ── Visitors ───────────────────────────────────────────
    const [alice, bob, charlie, diana, eve] = await Visitor.insertMany([
      { name: 'Alice Johnson',  email: 'alice@acme.com',    phone: '5551001001', company: 'Acme Corp' },
      { name: 'Bob Williams',   email: 'bob@techco.com',    phone: '5551002002', company: 'TechCo' },
      { name: 'Charlie Brown',  email: 'charlie@mail.com',  phone: '5551003003', company: 'Brown & Co' },
      { name: 'Diana Prince',   email: 'diana@star.com',    phone: '5551004004', company: 'Star Industries' },
      { name: 'Eve Turner',     email: 'eve@freelance.io',  phone: '5551005005', company: '' },
    ]);

    // ── Appointments ───────────────────────────────────────
    const now   = new Date();
    const hours = (h) => new Date(now.getTime() + h * 60 * 60 * 1000);

    const appointments = await Appointment.insertMany([
      // Today — approved
      {
        host: john._id,    visitor: alice._id,
        purpose: 'Quarterly business review',
        expectedDate: hours(2),   status: 'Approved',
      },
      // Today — pending
      {
        host: sarah._id,   visitor: bob._id,
        purpose: 'Product demo presentation',
        expectedDate: hours(4),   status: 'Pending',
      },
      // Today — approved
      {
        host: admin._id,   visitor: charlie._id,
        purpose: 'IT infrastructure audit',
        expectedDate: hours(1),   status: 'Approved',
      },
      // Tomorrow — pending
      {
        host: john._id,    visitor: diana._id,
        purpose: 'Contract negotiation meeting',
        expectedDate: hours(26),  status: 'Pending',
      },
      // Yesterday — rejected
      {
        host: sarah._id,   visitor: eve._id,
        purpose: 'Interview for design position',
        expectedDate: hours(-20), status: 'Rejected',
      },
      // 2 days ahead — pending
      {
        host: admin._id,   visitor: alice._id,
        purpose: 'Security compliance walkthrough',
        expectedDate: hours(50),  status: 'Pending',
      },
    ]);

    // ── Passes for Approved appointments ──────────────────
    const approvedApts = appointments.filter(a => a.status === 'Approved');
    const passes = await Pass.insertMany(
      approvedApts.map(apt => ({
        appointment: apt._id,
        qrCodeData:  crypto.randomBytes(20).toString('hex'),
        validFrom:   apt.expectedDate,
        validUntil:  new Date(apt.expectedDate.getTime() + 24 * 60 * 60 * 1000),
        status:      'Active',
      }))
    );

    // ── CheckLog for first approved appointment (already checked in) ──
    if (passes.length > 0) {
      await CheckLog.insertMany([
        {
          pass:               passes[0]._id,
          securityPersonnel:  security._id,
          checkInTime:        new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
        },
      ]);
    }

    console.log('✅ Demo data imported!');
    console.log('');
    console.log('   Staff logins (password: "password"):');
    console.log('   admin@example.com    → Admin');
    console.log('   security@example.com → Security');
    console.log('   john@example.com     → Employee');
    console.log('   sarah@example.com    → Employee');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err);
    process.exit(1);
  }
};

importData();

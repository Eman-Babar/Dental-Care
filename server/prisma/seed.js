import pkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DentalCare database...");

  await prisma.appointment.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);

  const admin = await prisma.user.create({
    data: {
      name: "Clinic Admin",
      email: "admin@dentalcare.com",
      password: await bcrypt.hash("admin123", salt),
      role: "ADMIN",
      phone: "03001112222",
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      name: "Dr. Ahmed Ali",
      email: "doctor@dentalcare.com",
      password: await bcrypt.hash("doctor123", salt),
      role: "DOCTOR",
      phone: "03003334444",
      doctorProfile: {
        create: {
          specialization: "Orthodontist",
          qualification: "BDS, MDS",
          experience: 8,
          bio: "Specialist in braces and clear aligners.",
          workingDays: "Mon-Sat",
          workingHours: "9:00 AM - 5:00 PM",
        },
      },
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      name: "Dr. Sarah Khan",
      email: "sarah@dentalcare.com",
      password: await bcrypt.hash("doctor123", salt),
      role: "DOCTOR",
      phone: "03005556666",
      doctorProfile: {
        create: {
          specialization: "Dental Surgeon",
          qualification: "BDS",
          experience: 10,
          bio: "Experienced in surgical and restorative care.",
          workingDays: "Mon-Fri",
          workingHours: "10:00 AM - 6:00 PM",
        },
      },
    },
  });

  const patient = await prisma.user.create({
    data: {
      name: "Ali Khan",
      email: "patient@dentalcare.com",
      password: await bcrypt.hash("patient123", salt),
      role: "PATIENT",
      phone: "03007778888",
    },
  });

  const cleaning = await prisma.service.create({
    data: {
      title: "Dental Cleaning",
      description: "Professional plaque removal and polishing.",
      duration: 45,
      price: 2500,
    },
  });

  const rootCanal = await prisma.service.create({
    data: {
      title: "Root Canal Treatment",
      description: "Endodontic care to save infected teeth.",
      duration: 90,
      price: 12000,
    },
  });

  await prisma.service.create({
    data: {
      title: "Teeth Whitening",
      description: "Safe clinic whitening for a brighter smile.",
      duration: 60,
      price: 8000,
    },
  });

  await prisma.service.create({
    data: {
      title: "General Checkup",
      description: "Full oral examination and care plan.",
      duration: 30,
      price: 1500,
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor1.id,
      serviceId: cleaning.id,
      appointmentDate: new Date("2026-08-01"),
      appointmentTime: "10:00",
      currentProblem: "Routine cleaning and mild sensitivity.",
      medicalHistory: "No known allergies.",
      status: "PENDING",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor2.id,
      serviceId: rootCanal.id,
      appointmentDate: new Date("2026-07-10"),
      appointmentTime: "14:30",
      currentProblem: "Toothache in upper left molar.",
      status: "COMPLETED",
    },
  });

  console.log("Seed complete.");
  console.log("Admin:   admin@dentalcare.com / admin123");
  console.log("Doctor:  doctor@dentalcare.com / doctor123");
  console.log("Doctor2: sarah@dentalcare.com / doctor123");
  console.log("Patient: patient@dentalcare.com / patient123");
  console.log(`Created admin id=${admin.id}, doctors=${doctor1.id},${doctor2.id}, patient=${patient.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

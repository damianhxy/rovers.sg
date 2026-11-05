// Sample content for the public demo, whose disk is wiped on every restart.
// Runs at startup when SEED_DEMO_DATA=true and the site has no events, resources or awardees yet.
// Everything goes through the same model functions the admin pages use.
const fs = require("fs/promises");
const path = require("path");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const event = require("../models/event.js");
const resource = require("../models/resource.js");
const BPA = require("../models/BPA.js");
const short = require("../models/shortener.js");
dayjs.extend(utc);
dayjs.extend(timezone);

const IMAGES = path.join(__dirname, "..", "public", "img", "Beta");

// Times are relative to today (Singapore time), so there are always upcoming and past events.
const EVENTS = [
  {
    title: "Pulau Ubin Cycling Expedition",
    days: 5,
    start: "08:00",
    end: "16:00",
    location: "Pulau Ubin",
    category: ["adventure"],
    details: "A day of cycling round Pulau Ubin, with a stop at Chek Jawa Wetlands. Bring water.",
  },
  {
    title: "Coastal Cleanup at East Coast Park",
    days: 12,
    start: "08:30",
    end: "11:30",
    location: "East Coast Park, Area C",
    category: ["service"],
    details: "Gloves and bags are provided. Meet at the car park.",
  },
  {
    title: "Rover Fellowship Night",
    days: 19,
    start: "19:00",
    end: "22:00",
    location: "Scout HQ",
    category: ["fellowship"],
    details: "Games, food and catching up across crews.",
  },
  {
    title: "Basic Rover Leadership Course",
    days: 33,
    endDays: 34,
    start: "09:00",
    end: "17:00",
    location: "Sarimbun Scout Camp",
    category: ["courses"],
    details: "A two-day course on planning and leading activities.",
    link: "https://scout.org.sg",
  },
  {
    title: "Blood Donation Drive",
    days: -21,
    start: "10:00",
    end: "15:00",
    location: "Bloodbank@HSA",
    category: ["service"],
    photos: ["Blood Drive.jpg"],
  },
  {
    title: "Project Orion",
    days: -48,
    start: "09:00",
    end: "18:00",
    location: "Singapore",
    category: ["service", "fellowship"],
    photos: ["Project Orion.jpg"],
  },
  {
    title: "Gunung Rinjani Expedition",
    days: -75,
    endDays: -70,
    start: "06:00",
    end: "20:00",
    location: "Lombok, Indonesia",
    category: ["adventure"],
    details: "A five-day trek to the summit of Gunung Rinjani.",
    photos: ["Gunung Rinjani.jpg", "rinjani.jpg"],
  },
  {
    title: "World Scout Youth Forum",
    days: -120,
    endDays: -117,
    start: "09:00",
    end: "18:00",
    location: "Baku, Azerbaijan",
    category: ["courses"],
    photos: ["World Scout Youth Forum.jpg"],
  },
];

const RESOURCES = [
  {
    name: "Activity Consent Form",
    category: "Forms",
    description: "Sample form for parents or guardians of members under 18.",
    file: { name: "activity-consent-form.pdf", text: "Activity Consent Form - sample" },
  },
  {
    name: "Singapore Scout Association",
    category: "General Information",
    description: "The national Scout association.",
    url: "https://scout.org.sg",
  },
  {
    name: "World Organization of the Scout Movement",
    category: "General Information",
    url: "https://www.scout.org",
  },
  {
    name: "Rover Journey Planner",
    category: "Rover Journey",
    description: "Sample checklist for the stages of the Rover journey.",
    file: { name: "rover-journey-planner.pdf", text: "Rover Journey Planner - sample" },
  },
];

const AWARDEES = [
  { name: "Alex Tan", unit: "1st Rover Crew", year: "2019" },
  { name: "Priya Nair", unit: "3rd Rover Crew", year: "2021" },
  { name: "Daniel Lim", unit: "5th Rover Crew", year: "2023" },
  { name: "Mei Ling Goh", unit: "Rover Council", year: "2018", honorary: "on" },
];

const LINKS = [{ name: "Scout HQ website", orgurl: "https://scout.org.sg", newurl: "hq" }];

// A one-page PDF with a line of text, so file resources have something to download.
function samplePdf(text) {
  const safe = text.replace(/[()\\]/g, "");
  const stream = "BT /F1 18 Tf 72 720 Td (" + safe + ") Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R " +
      "/Resources << /Font << /F1 5 0 R >> >> >>",
    "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map(function (body, i) {
    const offset = pdf.length;
    pdf += i + 1 + " 0 obj\n" + body + "\nendobj\n";
    return offset;
  });
  const xref = pdf.length;
  pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  pdf += offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  pdf += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\n";
  pdf += "startxref\n" + xref + "\n%%EOF\n";
  return Buffer.from(pdf, "latin1");
}

// In the add-event form's format, "D MMM YY HH:mm", as Singapore time.
function eventTime(days, time) {
  return dayjs().tz("Asia/Singapore").add(days, "day").format("D MMM YY") + " " + time;
}

async function isEmpty() {
  const [events, resources, awardees] = await Promise.all([event.all(), resource.all(), BPA.all()]);
  return events.length === 0 && resources.length === 0 && awardees.length === 0;
}

exports.seedIfEmpty = async function () {
  if (!(await isEmpty())) {
    console.info("Demo data: site already has content, not seeding");
    return false;
  }

  for (const e of EVENTS) {
    const id = await event.add({
      body: {
        title: e.title,
        start: eventTime(e.days, e.start),
        end: eventTime(e.endDays === undefined ? e.days : e.endDays, e.end),
        location: e.location,
        details: e.details,
        link: e.link,
        category: e.category,
      },
    });
    if (e.photos) {
      const photos = await Promise.all(
        e.photos.map(async (name) => ({
          originalname: name,
          mimetype: "image/jpeg",
          buffer: await fs.readFile(path.join(IMAGES, name)),
        })),
      );
      await event.addPhotos(id, photos);
      await event.mark(id, e.photos[0]);
    }
  }

  for (const r of RESOURCES) {
    const req = { body: { name: r.name, category: r.category, description: r.description } };
    if (r.url) req.body.url = r.url;
    else req.file = { originalname: r.file.name, buffer: samplePdf(r.file.text) };
    await resource.add(req);
  }

  for (const a of AWARDEES) await BPA.add({ body: a });
  for (const l of LINKS) await short.add({ body: l });

  console.info(
    "Demo data: seeded " +
      EVENTS.length +
      " events, " +
      RESOURCES.length +
      " resources, " +
      AWARDEES.length +
      " awardees",
  );
  return true;
};

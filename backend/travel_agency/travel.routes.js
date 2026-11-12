import express from 'express';

export const TRAVEL_HOTELS = [
  {
    id: 'th-1',
    hotelName: 'Swissôtel Al Maqam (Clock Tower)',
    city: 'Makkah',
    country: 'Saudi Arabia',
    starRating: 5,
    distanceToHaram: '0m Direct Clock Tower Haram Access',
    allottedRooms: 25,
    bookedRooms: 19,
    availableRooms: 6,
    contractedRate: 210.00,
    roomTypes: ['Classic Haram View', 'Deluxe Kaaba View', 'Family Quad Suite'],
    contactDesk: '+966 12 571 7777',
    amenities: ['Direct Haram Audio', 'Buffet Breakfast', 'VIP Transport Shuttle', '24/7 Concierge']
  },
  {
    id: 'th-2',
    hotelName: 'Anwar Al Madinah Mövenpick',
    city: 'Madinah',
    country: 'Saudi Arabia',
    starRating: 5,
    distanceToHaram: 'Adjacent to Prophet\'s Mosque Courtyard',
    allottedRooms: 20,
    bookedRooms: 14,
    availableRooms: 6,
    contractedRate: 175.00,
    roomTypes: ['Superior King', 'Executive City View', 'Quad Family Room'],
    contactDesk: '+966 14 818 1000',
    amenities: ['Near Gate 15 (Ladies Gate)', '3 Multi-Cuisine Restaurants', 'Business Centre']
  },
  {
    id: 'th-3',
    hotelName: 'Grand Hyatt Dubai & Residences',
    city: 'Dubai',
    country: 'United Arab Emirates',
    starRating: 5,
    distanceToHaram: '10 mins to Downtown & Burj Khalifa',
    allottedRooms: 15,
    bookedRooms: 11,
    availableRooms: 4,
    contractedRate: 160.00,
    roomTypes: ['Grand King Room', 'Club View Suite', '2-Bedroom Family Suite'],
    contactDesk: '+971 4 317 1234',
    amenities: ['Resort Pools', 'Complimentary Metro Shuttle', 'Halal Breakfast Buffet']
  },
  {
    id: 'th-4',
    hotelName: 'Sultanahmet Palace Boutique Hotel',
    city: 'Istanbul',
    country: 'Turkey',
    starRating: 4,
    distanceToHaram: 'Historic Old City (Behind Blue Mosque)',
    allottedRooms: 12,
    bookedRooms: 8,
    availableRooms: 4,
    contractedRate: 115.00,
    roomTypes: ['Standard Ottoman Room', 'Sea View Deluxe', 'Family Suite'],
    contactDesk: '+90 212 458 0460',
    amenities: ['Bosphorus Terrace', 'Traditional Turkish Breakfast', 'Airport Transfer Desk']
  },
  {
    id: 'th-5',
    hotelName: 'The Landmark Hotel London (Marylebone)',
    city: 'London',
    country: 'United Kingdom',
    starRating: 5,
    distanceToHaram: 'Central London (Opposite Marylebone Station)',
    allottedRooms: 10,
    bookedRooms: 7,
    availableRooms: 3,
    contractedRate: 290.00,
    roomTypes: ['Superior Room', 'Deluxe Marylebone King', 'Atrium Executive Suite'],
    contactDesk: '+44 20 7631 8000',
    amenities: ['Glass Roof Atrium', 'Winter Garden Afternoon Tea', 'Spa & Heated Pool']
  }
];

export const TRAVEL_HOTEL_BOOKINGS = [
  {
    id: 'thb-1',
    voucherNo: 'VCH-TRV-2026-901',
    confirmationCode: 'KSA-CONF-7741',
    guestName: 'Saima Bano & Family',
    passportNo: 'PK3344119',
    linkedVisaApp: 'VSA-2026-082',
    hotelId: 'th-1',
    hotelName: 'Swissôtel Al Maqam (Clock Tower)',
    city: 'Makkah',
    roomType: 'Family Quad Suite',
    checkIn: '2026-04-18',
    checkOut: '2026-04-24',
    nights: 6,
    roomsCount: 1,
    paxCount: 4,
    mealPlan: 'Bed & Breakfast (Buffet)',
    ratePerNight: 240.00,
    totalAmount: 1440.00,
    paidAmount: 1440.00,
    paymentStatus: 'PAID',
    voucherStatus: 'ISSUED_EMBASSY_CONFIRMED',
    purpose: 'Umrah Pilgrimage Visa Documentation',
    createdDate: '2026-03-22'
  },
  {
    id: 'thb-2',
    voucherNo: 'VCH-TRV-2026-902',
    confirmationCode: 'TURK-RES-3829',
    guestName: 'Kamran Siddiqui',
    passportNo: 'PK9988771',
    linkedVisaApp: 'VSA-2026-081',
    hotelId: 'th-4',
    hotelName: 'Sultanahmet Palace Boutique Hotel',
    city: 'Istanbul',
    roomType: 'Sea View Deluxe',
    checkIn: '2026-04-10',
    checkOut: '2026-04-16',
    nights: 6,
    roomsCount: 1,
    paxCount: 2,
    mealPlan: 'Bed & Breakfast',
    ratePerNight: 125.00,
    totalAmount: 750.00,
    paidAmount: 750.00,
    paymentStatus: 'PAID',
    voucherStatus: 'ISSUED_EMBASSY_CONFIRMED',
    purpose: 'Tourist Visa Proof of Accommodation',
    createdDate: '2026-03-20'
  },
  {
    id: 'thb-3',
    voucherNo: 'VCH-TRV-2026-903',
    confirmationCode: 'DXB-CONF-1102',
    guestName: 'Zainab Qureshi',
    passportNo: 'PK7711223',
    linkedVisaApp: 'VSA-2026-084',
    hotelId: 'th-3',
    hotelName: 'Grand Hyatt Dubai & Residences',
    city: 'Dubai',
    roomType: 'Grand King Room',
    checkIn: '2026-04-05',
    checkOut: '2026-04-12',
    nights: 7,
    roomsCount: 1,
    paxCount: 1,
    mealPlan: 'Room Only',
    ratePerNight: 160.00,
    totalAmount: 1120.00,
    paidAmount: 600.00,
    paymentStatus: 'PARTIAL',
    voucherStatus: 'PROVISIONAL',
    purpose: 'UAE Visit Visa Itinerary Proof',
    createdDate: '2026-03-25'
  }
];

export const TRAVEL_VISAS = [
  { id: 'vsa-1', appNo: 'VSA-2026-081', clientName: 'Kamran Siddiqui', passportNo: 'PK9988771', country: 'United Kingdom', visaType: 'Standard Visitor (6 Months)', embassyFee: 160.00, serviceFee: 75.00, status: 'SUBMITTED', submissionDate: '2026-03-20', trackingRef: 'UKVI-094182', hotelVoucherRef: 'VCH-TRV-2026-902', hotelName: 'Sultanahmet Palace Boutique Hotel' },
  { id: 'vsa-2', appNo: 'VSA-2026-082', clientName: 'Saima Bano', passportNo: 'PK3344119', country: 'Saudi Arabia', visaType: 'Umrah Tourist E-Visa', embassyFee: 120.00, serviceFee: 50.00, status: 'APPROVED', submissionDate: '2026-03-22', trackingRef: 'KSA-EV-88421', hotelVoucherRef: 'VCH-TRV-2026-901', hotelName: 'Swissôtel Al Maqam (Clock Tower)' },
  { id: 'vsa-3', appNo: 'VSA-2026-083', clientName: 'Farooq Azam', passportNo: 'PK5566228', country: 'Schengen (Italy)', visaType: 'Business / Conference', embassyFee: 90.00, serviceFee: 80.00, status: 'PROCESSING', submissionDate: '2026-03-18', trackingRef: 'VFS-IT-33109', hotelVoucherRef: null, hotelName: null },
  { id: 'vsa-4', appNo: 'VSA-2026-084', clientName: 'Zainab Qureshi', passportNo: 'PK7711223', country: 'United Arab Emirates', visaType: '30 Days Tourist', embassyFee: 85.00, serviceFee: 35.00, status: 'APPROVED', submissionDate: '2026-03-25', trackingRef: 'GDRFA-991204', hotelVoucherRef: 'VCH-TRV-2026-903', hotelName: 'Grand Hyatt Dubai & Residences' }
];

export const TRAVEL_PACKAGES = [
  { id: 'pkg-1', code: 'TRV-TURK-01', title: 'Scenic Turkey: Istanbul & Cappadocia Cave Stay', duration: '7 Days / 6 Nights', pricePerPerson: 1250.00, inclusions: ['4-Star Sultanahmet Hotel', 'Hot Air Balloon Ride', 'Bosphorus Cruise', 'Airport Transfers'], departure: 'Every Tuesday', status: 'ACTIVE' },
  { id: 'pkg-2', code: 'TRV-UMR-02', title: 'Premium Umrah Deluxe Package 2026', duration: '14 Days / 13 Nights', pricePerPerson: 1850.00, inclusions: ['5-Star Clock Tower Makkah', 'Madinah Haram Front', 'VIP Bus Ziyarat', 'Visa Processing'], departure: 'Weekly', status: 'ACTIVE' },
  { id: 'pkg-3', code: 'TRV-BAK-03', title: 'Baku Splendors: City & Shahdag Mountain', duration: '5 Days / 4 Nights', pricePerPerson: 699.00, inclusions: ['City Center Hotel', 'Cable Car Pass', 'Daily Breakfast', 'Guide'], departure: 'Bi-weekly', status: 'ACTIVE' }
];

export const TRAVEL_BOOKINGS = [
  { id: 'bkg-1', refNo: 'BKG-2026-4401', client: 'Kamran Siddiqui', package: 'Scenic Turkey: Istanbul & Cappadocia', pax: 2, totalAmount: 2500.00, paidAmount: 2500.00, status: 'CONFIRMED', travelDate: '2026-04-10' },
  { id: 'bkg-2', refNo: 'BKG-2026-4402', client: 'Saima Bano & Family', package: 'Premium Umrah Deluxe Package 2026', pax: 4, totalAmount: 7400.00, paidAmount: 3700.00, status: 'PARTIALLY_PAID', travelDate: '2026-04-18' }
];

export function createTravelRouter(sqliteDb, db, getPackages, getVisas) {
  const router = express.Router();
  const packages = () => (getPackages ? getPackages() : TRAVEL_PACKAGES);
  const visas = () => (getVisas ? getVisas() : TRAVEL_VISAS);

  router.get('/visas', (req, res) => {
    res.json({ ok: true, visas: visas() });
  });

  router.post('/visas', (req, res) => {
    const v = req.body || {};
    let voucherRef = null;
    let assignedHotel = null;

    if (v.includeHotelBooking && v.hotelId) {
      const hotel = TRAVEL_HOTELS.find(h => h.id === v.hotelId);
      if (hotel) {
        assignedHotel = hotel.hotelName;
        voucherRef = 'VCH-TRV-2026-' + Math.floor(910 + Math.random() * 90);
        const newHotelBooking = {
          id: 'thb-' + Date.now(),
          voucherNo: voucherRef,
          confirmationCode: 'HTL-' + Math.floor(1000 + Math.random() * 9000),
          guestName: v.clientName || 'Travel Client',
          passportNo: v.passportNo || 'PK' + Math.floor(1000000 + Math.random() * 9000000),
          linkedVisaApp: 'Pending',
          hotelId: hotel.id,
          hotelName: hotel.hotelName,
          city: hotel.city,
          roomType: v.hotelRoomType || hotel.roomTypes[0] || 'Standard Room',
          checkIn: v.hotelCheckIn || '2026-05-01',
          checkOut: v.hotelCheckOut || '2026-05-07',
          nights: Number(v.hotelNights || 6),
          roomsCount: Number(v.roomsCount || 1),
          paxCount: Number(v.paxCount || 1),
          mealPlan: v.hotelMealPlan || 'Bed & Breakfast',
          ratePerNight: hotel.contractedRate,
          totalAmount: hotel.contractedRate * Number(v.hotelNights || 6),
          paidAmount: hotel.contractedRate * Number(v.hotelNights || 6),
          paymentStatus: 'PAID',
          voucherStatus: 'ISSUED_EMBASSY_CONFIRMED',
          purpose: 'Embassy Visa Proof of Accommodation',
          createdDate: new Date().toISOString().split('T')[0]
        };
        TRAVEL_HOTEL_BOOKINGS.unshift(newHotelBooking);
        if (hotel.availableRooms > 0) {
          hotel.availableRooms--;
          hotel.bookedRooms++;
        }
      }
    }

    const visaList = visas();
    const newVisa = {
      id: 'vsa-' + Date.now(),
      appNo: 'VSA-2026-' + String(visaList.length + 1).padStart(3, '0'),
      clientName: v.clientName || 'Travel Client',
      passportNo: v.passportNo || 'PK' + Math.floor(1000000 + Math.random() * 9000000),
      country: v.country || 'United Kingdom',
      visaType: v.visaType || 'Tourist Visa',
      embassyFee: Number(v.embassyFee || 100),
      serviceFee: Number(v.serviceFee || 50),
      status: 'SUBMITTED',
      submissionDate: new Date().toISOString().split('T')[0],
      trackingRef: 'TRK-' + Math.floor(100000 + Math.random() * 900000),
      hotelVoucherRef: voucherRef,
      hotelName: assignedHotel
    };

    if (voucherRef) {
      const bkg = TRAVEL_HOTEL_BOOKINGS.find(b => b.voucherNo === voucherRef);
      if (bkg) bkg.linkedVisaApp = newVisa.appNo;
    }

    visaList.unshift(newVisa);
    res.json({ ok: true, message: 'Visa file submitted for embassy tracking', visa: newVisa });
  });

  router.post('/visas/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const visa = visas().find(v => v.id === id);
    if (visa) {
      visa.status = status;
      return res.json({ ok: true, message: `Visa status updated to ${status}`, visa });
    }
    res.status(404).json({ ok: false, message: 'Visa file not found' });
  });

  router.get('/packages', (req, res) => {
    res.json({ ok: true, packages: packages() });
  });

  router.get('/bookings', (req, res) => {
    res.json({ ok: true, bookings: TRAVEL_BOOKINGS });
  });

  router.get('/hotels', (req, res) => {
    res.json({ ok: true, hotels: TRAVEL_HOTELS });
  });

  router.get('/hotel-bookings', (req, res) => {
    res.json({ ok: true, bookings: TRAVEL_HOTEL_BOOKINGS });
  });

  router.post('/hotel-bookings', (req, res) => {
    const b = req.body || {};
    const hotel = TRAVEL_HOTELS.find(h => h.id === b.hotelId) || TRAVEL_HOTELS[0];
    const nights = Number(b.nights || 5);
    const rate = Number(b.ratePerNight || hotel.contractedRate || 150);
    const totalAmount = nights * rate * Number(b.roomsCount || 1);

    const newBooking = {
      id: 'thb-' + Date.now(),
      voucherNo: 'VCH-TRV-2026-' + Math.floor(920 + Math.random() * 80),
      confirmationCode: (b.countryCode || 'HTL') + '-CONF-' + Math.floor(1000 + Math.random() * 9000),
      guestName: b.guestName || 'Tourist Client',
      passportNo: b.passportNo || 'PK' + Math.floor(1000000 + Math.random() * 9000000),
      linkedVisaApp: b.linkedVisaApp || 'None',
      hotelId: hotel.id,
      hotelName: hotel.hotelName,
      city: hotel.city,
      roomType: b.roomType || hotel.roomTypes[0] || 'Standard Room',
      checkIn: b.checkIn || '2026-05-10',
      checkOut: b.checkOut || '2026-05-15',
      nights,
      roomsCount: Number(b.roomsCount || 1),
      paxCount: Number(b.paxCount || 2),
      mealPlan: b.mealPlan || 'Bed & Breakfast',
      ratePerNight: rate,
      totalAmount,
      paidAmount: Number(b.paidAmount || totalAmount),
      paymentStatus: (b.paidAmount >= totalAmount || !b.paidAmount) ? 'PAID' : (b.paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
      voucherStatus: 'ISSUED_EMBASSY_CONFIRMED',
      purpose: b.purpose || 'Tourist Visa & Holiday Accommodation',
      createdDate: new Date().toISOString().split('T')[0]
    };

    TRAVEL_HOTEL_BOOKINGS.unshift(newBooking);
    if (hotel.availableRooms > 0) {
      hotel.availableRooms--;
      hotel.bookedRooms++;
    }

    if (b.linkedVisaApp && b.linkedVisaApp !== 'None') {
      const v = visas().find(visa => visa.appNo === b.linkedVisaApp);
      if (v) {
        v.hotelVoucherRef = newBooking.voucherNo;
        v.hotelName = hotel.hotelName;
      }
    }

    res.json({ ok: true, message: 'Hotel booking registered & embassy voucher generated', booking: newBooking });
  });

  router.post('/hotel-bookings/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const booking = TRAVEL_HOTEL_BOOKINGS.find(b => b.id === id);
    if (booking) {
      booking.voucherStatus = status;
      return res.json({ ok: true, message: `Voucher status updated to ${status}`, booking });
    }
    res.status(404).json({ ok: false, message: 'Hotel booking voucher not found' });
  });

  return router;
}

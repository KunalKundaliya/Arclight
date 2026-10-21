export const initialRooms = [
  {
    id: 'room-01',
    name: 'Chamber Alpha (Hybrid Nexus)',
    location: 'Building 4, Floor 3 — Suite 302',
    capacity: 6,
    type: 'Hybrid Physical',
    equipment: ['4K Ultra HD Display', 'Dual Glass Whiteboards', 'Polycom Studio Soundbar', 'Dual HD PTZ Cameras'],
    status: 'Available',
    features: ['High-speed Fiber', 'Acoustic Soundproofing', 'Wheelchair Accessible'],
    currentStatusNote: 'Ready for hybrid sessions'
  },
  {
    id: 'room-02',
    name: 'Sanctum West Pod 04',
    location: 'West Wing, Floor 2',
    capacity: 3,
    type: 'Physical Pod',
    equipment: ['Ultra-wide Curved Monitor', 'Digital Wacom Tablet', 'Shure Microphone', 'Ergonomic Standing Desk'],
    status: 'Occupied',
    features: ['Sound-isolated Booth', 'Direct LAN Link'],
    currentStatusNote: 'Interview in session until 3:00 PM'
  },
  {
    id: 'room-03',
    name: 'Virtual Cloud Chamber 1 (CodeCollab)',
    location: 'Cloud Infrastructure / AWS us-east-1',
    capacity: 20,
    type: 'Virtual Hub',
    equipment: ['Low-Latency Screen Share', 'Collaborative Cloud IDE', 'Multi-channel Audio', 'Automatic AI Transcription'],
    status: 'Available',
    features: ['End-to-End Encryption', 'Zero-Install WebRTC', 'Candidate Code Sandboxing'],
    currentStatusNote: 'Online and healthy'
  },
  {
    id: 'room-04',
    name: 'Virtual Cloud Chamber 2 (Zoom Enterprise)',
    location: 'Cloud Infrastructure / Global Edge',
    capacity: 50,
    type: 'Virtual Hub',
    equipment: ['1080p Video Stream', 'Breakout Rooms', 'Live Captions', 'Automated Cloud Archival'],
    status: 'Available',
    features: ['Single Sign-On', 'Secure Waiting Room', 'Audio Transcript'],
    currentStatusNote: 'Online and idle'
  },
  {
    id: 'room-05',
    name: 'Executive Boardroom 801',
    location: 'Tower 1, 8th Floor Executive Floor',
    capacity: 12,
    type: 'Physical Room',
    equipment: ['Triple 75" Presentation Screens', 'Ceiling Array Microphones', 'Cisco TelePresence', 'Smart Podium'],
    status: 'Maintenance',
    features: ['Panoramic View', 'AV Technician on standby'],
    currentStatusNote: 'AV Firmware upgrade until 5:00 PM'
  }
];

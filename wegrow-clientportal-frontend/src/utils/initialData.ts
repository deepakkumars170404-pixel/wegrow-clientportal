import { ClientData } from '../types';

export const INITIAL_CLIENTS_MAP: Record<string, ClientData> = {
  "C001": {
    "id": "C001",
    "clientId": "C001",
    "company": "Meridian Foods Pvt. Ltd.",
    "short": "MF",
    "color": "#C2410C",
    "industry": "Food processing & FMCG",
    "size": "240 employees",
    "city": "Coimbatore",
    "location": "Coimbatore, Tamil Nadu",
    "contact": "Arjun Mehta",
    "contactTitle": "Managing Director",
    "email": "arjun@meridianfoods.in",
    "phone": "+91 98410 22457",
    "start": "2026-10-01",
    "end": "2027-03-31",
    "consultant": "Dr. Thavabalan",
    "areas": [
      "Operations",
      "Process",
      "People",
      "Technology",
      "Finance",
      "Sales",
      "Management",
      "Supply chain"
    ],
    "people": {
      "ceo": "Arjun Mehta (MD)",
      "ops": "Operations Manager",
      "hr": "HR Head",
      "fin": "Finance Controller",
      "it": "IT Lead",
      "sales": "Sales Head"
    },
    "scoreHistory": [
      {
        "m": "Sep",
        "v": 61
      },
      {
        "m": "Oct",
        "v": 68
      },
      {
        "m": "Nov",
        "v": 76
      },
      {
        "m": "Dec",
        "v": 82
      }
    ],
    "dept": [
      {
        "k": "People",
        "prev": 62,
        "v": 84
      },
      {
        "k": "Process",
        "prev": 58,
        "v": 78
      },
      {
        "k": "Technology",
        "prev": 60,
        "v": 72
      },
      {
        "k": "Operations",
        "prev": 71,
        "v": 86
      },
      {
        "k": "Management",
        "prev": 74,
        "v": 88
      }
    ],
    "months": [
      {
        "n": 1,
        "key": "2026-10",
        "name": "October",
        "year": 2026,
        "theme": "Foundation & Business Assessment",
        "objective": "Understand the current business structure and identify operational gaps.",
        "focus": [
          "Organisation structure",
          "Process mapping",
          "Role clarity",
          "Current performance baseline"
        ],
        "outcome": "A clear picture of the current business structure and the priority improvement areas.",
        "notes": "Leadership was candid about gaps, which made the assessment unusually sharp. Keep that openness going into process work."
      },
      {
        "n": 2,
        "key": "2026-11",
        "name": "November",
        "year": 2026,
        "theme": "Process Optimisation",
        "objective": "Document and streamline the core operating processes that drive delivery and cost.",
        "focus": [
          "SOP framework",
          "Bottleneck removal",
          "Process ownership",
          "Quality checkpoints"
        ],
        "outcome": "Documented SOPs for critical processes with a named owner for each.",
        "notes": "SOP drafting ran slightly behind on the finance side. We have agreed a catch-up plan in the December review."
      },
      {
        "n": 3,
        "key": "2026-12",
        "name": "December",
        "year": 2026,
        "theme": "People & Organisation",
        "objective": "Align roles, responsibilities and capability with the redesigned processes.",
        "focus": [
          "Role charters",
          "Reporting lines",
          "Capability gaps",
          "Performance conversations"
        ],
        "outcome": "Role charters for every department head and a capability plan for the next two quarters.",
        "notes": "Focus this month is ownership. Every role charter must be signed off by the person holding the role, not just their manager."
      },
      {
        "n": 4,
        "key": "2027-01",
        "name": "January",
        "year": 2027,
        "theme": "Technology & Systems",
        "objective": "Select and configure the systems that will hold the new processes in place.",
        "focus": [
          "Systems audit",
          "ERP/CRM fit",
          "Dashboard design",
          "Data hygiene"
        ],
        "outcome": "A live management dashboard fed by clean operational data.",
        "notes": "Shortlist to be finalised after the December steering meeting."
      },
      {
        "n": 5,
        "key": "2027-02",
        "name": "February",
        "year": 2027,
        "theme": "Performance & Growth",
        "objective": "Install a KPI rhythm and open two growth levers.",
        "focus": [
          "KPI cadence",
          "Sales pipeline",
          "Pricing review",
          "Customer retention"
        ],
        "outcome": "Weekly KPI reviews running without consultant support.",
        "notes": ""
      },
      {
        "n": 6,
        "key": "2027-03",
        "name": "March",
        "year": 2027,
        "theme": "Review & Sustainability",
        "objective": "Measure the transformation and hand over a self-running management system.",
        "focus": [
          "Impact review",
          "Governance calendar",
          "Leadership playbook",
          "Next-year roadmap"
        ],
        "outcome": "A sustainability plan and a documented operating rhythm owned by the leadership team.",
        "notes": ""
      }
    ],
    "status": "Active",
    "actions": [
      {
        "id": "A1",
        "actionId": "A1",
        "month": 1,
        "title": "Complete business assessment",
        "desc": "Structured interviews with leadership and review of financials.",
        "priority": "High",
        "owner": "Arjun Mehta",
        "due": "2026-10-10",
        "status": "Completed",
        "progress": 100,
        "comments": [],
        "attachments": []
      },
      {
        "id": "A2",
        "actionId": "A2",
        "month": 1,
        "title": "Map core process flows",
        "desc": "Document end-to-end flows for the core value streams.",
        "priority": "High",
        "owner": "Operations Manager",
        "due": "2026-10-24",
        "status": "Completed",
        "progress": 100,
        "comments": [],
        "attachments": []
      },
      {
        "id": "A3",
        "actionId": "A3",
        "month": 2,
        "title": "Redesign order-to-delivery flow",
        "desc": "Cut cycle time by standardising handoffs between departments.",
        "priority": "High",
        "owner": "Operations Manager",
        "due": "2026-11-14",
        "status": "In Progress",
        "progress": 60,
        "comments": [],
        "attachments": []
      },
      {
        "id": "A4",
        "actionId": "A4",
        "month": 3,
        "title": "Establish weekly management cadence",
        "desc": "Set up cross-functional weekly rhythm for operational reviews.",
        "priority": "Medium",
        "owner": "Arjun Mehta",
        "due": "2026-12-20",
        "status": "In Progress",
        "progress": 40,
        "comments": [],
        "attachments": []
      }
    ],
    "sessions": [
      {
        "id": "S001",
        "sessionId": "S001",
        "title": "Business Transformation & Review Session",
        "date": "2026-12-14",
        "time": "10:00 AM – 1:00 PM",
        "duration": 180,
        "mode": "In person",
        "location": "Corporate Boardroom & WeGrow Live Stream",
        "consultant": "Dr. Thavabalan",
        "status": "Completed",
        "agenda": [
          "Strategic Roadmap Review",
          "Bottleneck Identification",
          "Action Items Delegation"
        ],
        "objectives": [
          "Establish operational alignment and review progress"
        ],
        "attachments": []
      },
      {
        "id": "S002",
        "sessionId": "S002",
        "title": "Operational Excellence Checkpoint",
        "date": "2026-12-28",
        "time": "2:30 PM – 4:30 PM",
        "duration": 120,
        "mode": "In person",
        "location": "Main Campus & Zoom Hybrid",
        "consultant": "Dr. Thavabalan",
        "status": "Upcoming",
        "agenda": [
          "Review Sprint Deliverables",
          "KPI Metric Tracking"
        ],
        "objectives": [
          "Ensure Q1 transformation goals are on track"
        ],
        "attachments": []
      }
    ],
    "reports": [
      {
        "id": "R1",
        "reportId": "R1",
        "name": "Transformation Diagnostic & Progress Report",
        "date": "2026-12-10",
        "cat": "Assessment",
        "desc": "Monthly review of organizational alignment and key metrics.",
        "pages": 14
      }
    ],
    "updates": [
      {
        "id": "U1",
        "updateId": "U1",
        "title": "Sprint 3 Milestones Achieved",
        "date": "2026-12-12",
        "cat": "Transformation",
        "type": "Milestone",
        "body": "Leadership assessment and core process mapping have been successfully completed across departments."
      }
    ],
    "events": [],
    "photos": [],
    "documents": [],
    "notifications": [],
    "feedback": [
      {
        "session": "S001",
        "rating": 5,
        "relevance": "Very Relevant",
        "useful": "Actionable Roadmap & Next Steps\nBottlenecks & Growth Levers",
        "improve": "None noted",
        "comments": "Exceptional consulting guidance from Dr. Thavabalan.",
        "date": "2026-12-14",
        "attendeeName": "Arjun Mehta",
        "attendeeRole": "Managing Director"
      }
    ],
    "attendances": [
      {
        "id": "att_1_C001",
        "clientId": "C001",
        "sessionId": "S001",
        "name": "Arjun Mehta",
        "phone": "+91 98410 22457",
        "whatsapp": "+91 98410 22457",
        "company": "Meridian Foods Pvt. Ltd.",
        "designation": "Managing Director",
        "checkedInAt": "2026-12-14T09:45:00.000Z",
        "feedbackSent": true,
        "feedbackSubmitted": true
      }
    ]
  },
  "C002": {
    "id": "C002",
    "clientId": "C002",
    "company": "Kaveri Textiles Ltd.",
    "short": "KT",
    "color": "#0F766E",
    "industry": "Textile manufacturing",
    "size": "410 employees",
    "city": "Tiruppur",
    "location": "Tiruppur, Tamil Nadu",
    "contact": "Lakshmi Sundar",
    "contactTitle": "Chief Executive",
    "email": "lakshmi@kaveritextiles.in",
    "phone": "+91 94440 18820",
    "start": "2026-10-01",
    "end": "2027-03-31",
    "consultant": "Priya Raman",
    "areas": [
      "Operations",
      "Quality",
      "People",
      "Export compliance",
      "Finance",
      "Management"
    ],
    "people": {
      "ceo": "Lakshmi Sundar (CEO)",
      "ops": "Plant Head",
      "hr": "HR Manager",
      "fin": "CFO",
      "it": "Systems Manager",
      "sales": "Export Head"
    },
    "scoreHistory": [
      {
        "m": "Sep",
        "v": 55
      },
      {
        "m": "Oct",
        "v": 60
      },
      {
        "m": "Nov",
        "v": 66
      },
      {
        "m": "Dec",
        "v": 71
      }
    ],
    "dept": [
      {
        "k": "People",
        "prev": 52,
        "v": 68
      },
      {
        "k": "Process",
        "prev": 50,
        "v": 70
      },
      {
        "k": "Technology",
        "prev": 48,
        "v": 61
      },
      {
        "k": "Operations",
        "prev": 63,
        "v": 77
      },
      {
        "k": "Management",
        "prev": 60,
        "v": 74
      }
    ],
    "months": [
      {
        "n": 1,
        "key": "2026-10",
        "name": "October",
        "year": 2026,
        "theme": "Foundation & Business Assessment",
        "objective": "Understand the current business structure and identify operational gaps.",
        "focus": [
          "Organisation structure",
          "Process mapping",
          "Role clarity",
          "Current performance baseline"
        ],
        "outcome": "A clear picture of the current business structure and the priority improvement areas.",
        "notes": "Initial evaluation completed."
      },
      {
        "n": 2,
        "key": "2026-11",
        "name": "November",
        "year": 2026,
        "theme": "Process Optimisation",
        "objective": "Document and streamline the core operating processes that drive delivery and cost.",
        "focus": [
          "SOP framework",
          "Bottleneck removal",
          "Process ownership",
          "Quality checkpoints"
        ],
        "outcome": "Documented SOPs for critical processes with a named owner for each.",
        "notes": "Quality inspection SOPs are running on Line 2."
      },
      {
        "n": 3,
        "key": "2026-12",
        "name": "December",
        "year": 2026,
        "theme": "People & Organisation",
        "objective": "Align roles, responsibilities and capability with the redesigned processes.",
        "focus": [
          "Role charters",
          "Reporting lines",
          "Capability gaps",
          "Performance conversations"
        ],
        "outcome": "Role charters for every department head.",
        "notes": "Focus on production supervisors."
      },
      {
        "n": 4,
        "key": "2027-01",
        "name": "January",
        "year": 2027,
        "theme": "Technology & Systems",
        "objective": "Select and configure ERP for textile tracking.",
        "focus": [
          "Systems audit",
          "ERP shortlist",
          "Inventory control"
        ],
        "outcome": "ERP selection finalized.",
        "notes": ""
      },
      {
        "n": 5,
        "key": "2027-02",
        "name": "February",
        "year": 2027,
        "theme": "Performance & Growth",
        "objective": "Install a weekly KPI rhythm.",
        "focus": [
          "KPI cadence",
          "Export pipeline"
        ],
        "outcome": "Self-running review.",
        "notes": ""
      },
      {
        "n": 6,
        "key": "2027-03",
        "name": "March",
        "year": 2027,
        "theme": "Review & Sustainability",
        "objective": "Measure impact and handover.",
        "focus": [
          "Impact review",
          "Sustainability"
        ],
        "outcome": "Handover complete.",
        "notes": ""
      }
    ],
    "status": "Active",
    "actions": [
      {
        "id": "A1",
        "actionId": "A1",
        "month": 1,
        "title": "Complete business assessment",
        "desc": "Structured interviews with leadership and review of financials.",
        "priority": "High",
        "owner": "Lakshmi Sundar",
        "due": "2026-10-10",
        "status": "Completed",
        "progress": 100,
        "comments": [],
        "attachments": []
      },
      {
        "id": "A2",
        "actionId": "A2",
        "month": 1,
        "title": "Map core process flows",
        "desc": "Document end-to-end flows for the core value streams.",
        "priority": "High",
        "owner": "Operations Manager",
        "due": "2026-10-24",
        "status": "Completed",
        "progress": 100,
        "comments": [],
        "attachments": []
      },
      {
        "id": "A3",
        "actionId": "A3",
        "month": 2,
        "title": "Redesign order-to-delivery flow",
        "desc": "Cut cycle time by standardising handoffs between departments.",
        "priority": "High",
        "owner": "Operations Manager",
        "due": "2026-11-14",
        "status": "In Progress",
        "progress": 60,
        "comments": [],
        "attachments": []
      },
      {
        "id": "A4",
        "actionId": "A4",
        "month": 3,
        "title": "Establish weekly management cadence",
        "desc": "Set up cross-functional weekly rhythm for operational reviews.",
        "priority": "Medium",
        "owner": "Lakshmi Sundar",
        "due": "2026-12-20",
        "status": "In Progress",
        "progress": 40,
        "comments": [],
        "attachments": []
      }
    ],
    "sessions": [
      {
        "id": "S001",
        "sessionId": "S001",
        "title": "Business Transformation & Review Session",
        "date": "2026-12-14",
        "time": "10:00 AM – 1:00 PM",
        "duration": 180,
        "mode": "In person",
        "location": "Corporate Boardroom & WeGrow Live Stream",
        "consultant": "Priya Raman",
        "status": "Completed",
        "agenda": [
          "Strategic Roadmap Review",
          "Bottleneck Identification",
          "Action Items Delegation"
        ],
        "objectives": [
          "Establish operational alignment and review progress"
        ],
        "attachments": []
      },
      {
        "id": "S002",
        "sessionId": "S002",
        "title": "Operational Excellence Checkpoint",
        "date": "2026-12-28",
        "time": "2:30 PM – 4:30 PM",
        "duration": 120,
        "mode": "In person",
        "location": "Main Campus & Zoom Hybrid",
        "consultant": "Priya Raman",
        "status": "Upcoming",
        "agenda": [
          "Review Sprint Deliverables",
          "KPI Metric Tracking"
        ],
        "objectives": [
          "Ensure Q1 transformation goals are on track"
        ],
        "attachments": []
      }
    ],
    "reports": [
      {
        "id": "R1",
        "reportId": "R1",
        "name": "Transformation Diagnostic & Progress Report",
        "date": "2026-12-10",
        "cat": "Assessment",
        "desc": "Monthly review of organizational alignment and key metrics.",
        "pages": 12
      }
    ],
    "updates": [
      {
        "id": "U1",
        "updateId": "U1",
        "title": "Sprint 3 Milestones Achieved",
        "date": "2026-12-12",
        "cat": "Transformation",
        "type": "Milestone",
        "body": "Leadership assessment and core process mapping have been successfully completed across departments."
      }
    ],
    "events": [],
    "photos": [],
    "documents": [],
    "notifications": [],
    "feedback": [
      {
        "session": "S001",
        "rating": 5,
        "relevance": "Very Relevant",
        "useful": "Actionable Roadmap & Next Steps\nBottlenecks & Growth Levers",
        "improve": "None noted",
        "comments": "Exceptional consulting guidance from Dr. Thavabalan.",
        "date": "2026-12-14",
        "attendeeName": "Lakshmi Sundar",
        "attendeeRole": "Chief Executive"
      }
    ],
    "attendances": [
      {
        "id": "att_1_C002",
        "clientId": "C002",
        "sessionId": "S001",
        "name": "Lakshmi Sundar",
        "phone": "+91 94440 18820",
        "whatsapp": "+91 94440 18820",
        "company": "Kaveri Textiles Ltd.",
        "designation": "Chief Executive",
        "checkedInAt": "2026-12-14T09:45:00.000Z",
        "feedbackSent": true,
        "feedbackSubmitted": true
      }
    ]
  }
};

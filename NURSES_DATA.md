## public.users

```json
[
    {
        "idx": 0,
        "id": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "email": "maria@email.com",
        "full_name": "Maria Hanigan",
        "is_online": true,
        "role": "Head Nurse",
        "created_at": "2025-12-16 19:07:17.884195+00",
        "updated_at": "2025-12-16 19:53:41.207333+00",
        "quick_switch_enabled": false,
        "quick_switch_pin": null,
        "pin": null
    },
    {
        "idx": 1,
        "id": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "email": "dimitriv@email.com",
        "full_name": "Dimitriv Kravanoff",
        "is_online": false,
        "role": "Emergency Department Nurse",
        "created_at": "2025-12-11 22:19:14.688507+00",
        "updated_at": "2025-12-15 23:54:29.724189+00",
        "quick_switch_enabled": true,
        "quick_switch_pin": "$2a$06$J77hf/p/pgP8pyelgLgsLeDAw69SbjhRAiUrz4Svhk2V.5ekjdUl6",
        "pin": null
    },
    {
        "idx": 2,
        "id": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "email": "cindy@email.com",
        "full_name": "Cindy Maxwell",
        "is_online": false,
        "role": "Surgical Nurse",
        "created_at": "2025-12-11 20:11:46.672529+00",
        "updated_at": "2025-12-16 19:05:31.004549+00",
        "quick_switch_enabled": true,
        "quick_switch_pin": "$2a$06$DOkX8IXwMrq49uvKDIBVWOHrLDRjclpAa8MPxleI6Uslc5CcdiBm.",
        "pin": null
    },
    {
        "idx": 3,
        "id": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "email": "mark@gmail.com",
        "full_name": "Mark Hoffner",
        "is_online": false,
        "role": "ICU/Trauma Nurse",
        "created_at": "2025-12-11 20:00:41.805365+00",
        "updated_at": "2025-12-16 19:05:54.325853+00",
        "quick_switch_enabled": true,
        "quick_switch_pin": "$2a$06$gsg5jz.plxJRlrkHAjiyT.1ERzE.0At1HISsn0XD5r1J0JZCIswda",
        "pin": null
    }
]
```

## public.nurse_shifts

```json
[
    {
        "idx": 0,
        "id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "user_id": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "role": "ICU/Trauma Nurse",
        "shift_start": "07:00:00",
        "shift_end": "19:00:00",
        "shift_date": "2025-12-11",
        "created_at": "2025-12-11 22:57:16.290156+00",
        "updated_at": "2025-12-11 22:57:16.290156+00"
    },
    {
        "idx": 1,
        "id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "user_id": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "role": "Surgical Nurse",
        "shift_start": "07:00:00",
        "shift_end": "15:00:00",
        "shift_date": "2025-12-11",
        "created_at": "2025-12-11 22:58:18.012843+00",
        "updated_at": "2025-12-11 22:58:18.012843+00"
    },
    {
        "idx": 2,
        "id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "user_id": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "role": "Head Nurse",
        "shift_start": "06:00:00",
        "shift_end": "18:00:00",
        "shift_date": "2025-12-16",
        "created_at": "2025-12-16 19:13:38.121572+00",
        "updated_at": "2025-12-16 19:13:38.121572+00"
    },
    {
        "idx": 3,
        "id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "user_id": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "role": "Emergency Department Nurse",
        "shift_start": "07:00:00",
        "shift_end": "18:00:00",
        "shift_date": "2025-12-11",
        "created_at": "2025-12-11 22:57:53.691578+00",
        "updated_at": "2025-12-11 22:57:53.691578+00"
    }
]
```

---

# React Flow Nurse Tasks Feature - Implementation Plan

## Database Schema Design

### New Tables Required

#### 1. `shift_tasks` - Main task table

```sql
CREATE TABLE shift_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES nurse_shifts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    patient_room VARCHAR(20),
    patient_name VARCHAR(100),

    -- Task details
    task_type VARCHAR(50) NOT NULL, -- 'medication', 'vitals', 'assessment', 'procedure', 'documentation', 'care', 'communication'
    task_subtype VARCHAR(50), -- e.g., 'iv_medication', 'oral_medication', 'blood_draw'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- 'critical', 'high', 'normal', 'low'

    -- Timing
    scheduled_time TIMESTAMPTZ NOT NULL,
    due_time TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped', 'overdue'

    -- React Flow positioning (for canvas)
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,

    -- Dependencies (for task flow)
    depends_on UUID[], -- Array of task IDs that must be completed first

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `task_categories` - Task type definitions

```sql
CREATE TABLE task_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50), -- Icon name for UI
    color VARCHAR(20), -- Color code for React Flow nodes
    default_duration_minutes INT DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `task_templates` - Reusable task templates

```sql
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES task_categories(id),
    role VARCHAR(50), -- Which nurse role this applies to
    title VARCHAR(200) NOT NULL,
    description TEXT,
    default_priority VARCHAR(20) DEFAULT 'normal',
    typical_duration_minutes INT DEFAULT 15,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_interval_hours INT, -- For recurring tasks
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Task Categories

```json
[
    {
        "id": "cat-001",
        "name": "medication",
        "display_name": "Medication Administration",
        "icon": "Pill",
        "color": "#3B82F6",
        "default_duration_minutes": 15
    },
    {
        "id": "cat-002",
        "name": "vitals",
        "display_name": "Vital Signs",
        "icon": "HeartPulse",
        "color": "#EF4444",
        "default_duration_minutes": 10
    },
    {
        "id": "cat-003",
        "name": "assessment",
        "display_name": "Patient Assessment",
        "icon": "Stethoscope",
        "color": "#10B981",
        "default_duration_minutes": 20
    },
    {
        "id": "cat-004",
        "name": "procedure",
        "display_name": "Medical Procedure",
        "icon": "Syringe",
        "color": "#F59E0B",
        "default_duration_minutes": 30
    },
    {
        "id": "cat-005",
        "name": "documentation",
        "display_name": "Documentation",
        "icon": "FileText",
        "color": "#6366F1",
        "default_duration_minutes": 15
    },
    {
        "id": "cat-006",
        "name": "care",
        "display_name": "Patient Care",
        "icon": "HandHeart",
        "color": "#EC4899",
        "default_duration_minutes": 25
    },
    {
        "id": "cat-007",
        "name": "communication",
        "display_name": "Communication",
        "icon": "MessageCircle",
        "color": "#8B5CF6",
        "default_duration_minutes": 15
    },
    {
        "id": "cat-008",
        "name": "critical",
        "display_name": "Critical Intervention",
        "icon": "AlertTriangle",
        "color": "#DC2626",
        "default_duration_minutes": 45
    }
]
```

---

## Generated Shift Tasks

### 1. Maria Hanigan (Head Nurse) - Shift: 06:00-18:00, Dec 16

```json
[
    {
        "id": "task-maria-001",
        "shift_id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "assigned_to": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "patient_room": null,
        "patient_name": null,
        "task_type": "communication",
        "task_subtype": "shift_handover",
        "title": "Receive Night Shift Report",
        "description": "Receive comprehensive handover from night shift charge nurse. Review census, critical patients, and pending issues.",
        "priority": "high",
        "scheduled_time": "2025-12-16T06:00:00Z",
        "due_time": "2025-12-16T06:30:00Z",
        "status": "completed",
        "position_x": 100,
        "position_y": 100
    },
    {
        "id": "task-maria-002",
        "shift_id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "assigned_to": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "patient_room": null,
        "patient_name": null,
        "task_type": "communication",
        "task_subtype": "staff_huddle",
        "title": "Morning Staff Huddle",
        "description": "Lead morning huddle with nursing staff. Assign patient loads, discuss critical cases, review staffing levels.",
        "priority": "high",
        "scheduled_time": "2025-12-16T06:30:00Z",
        "due_time": "2025-12-16T07:00:00Z",
        "status": "completed",
        "position_x": 250,
        "position_y": 100,
        "depends_on": ["task-maria-001"]
    },
    {
        "id": "task-maria-003",
        "shift_id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "assigned_to": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "patient_room": "ICU-3",
        "patient_name": "Robert Chen",
        "task_type": "assessment",
        "task_subtype": "rounds",
        "title": "ICU Patient Rounds - Robert Chen",
        "description": "Conduct rounds with attending physician for critical patient. Review ventilator settings, labs, and care plan.",
        "priority": "critical",
        "scheduled_time": "2025-12-16T08:00:00Z",
        "due_time": "2025-12-16T08:30:00Z",
        "status": "in_progress",
        "position_x": 400,
        "position_y": 100
    },
    {
        "id": "task-maria-004",
        "shift_id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "assigned_to": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "patient_room": null,
        "patient_name": null,
        "task_type": "documentation",
        "task_subtype": "quality_review",
        "title": "Quality Metrics Review",
        "description": "Review unit quality metrics: fall prevention compliance, medication error reports, patient satisfaction scores.",
        "priority": "normal",
        "scheduled_time": "2025-12-16T09:00:00Z",
        "due_time": "2025-12-16T10:00:00Z",
        "status": "pending",
        "position_x": 550,
        "position_y": 100
    },
    {
        "id": "task-maria-005",
        "shift_id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "assigned_to": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "patient_room": "302",
        "patient_name": "Eleanor Vance",
        "task_type": "communication",
        "task_subtype": "family_meeting",
        "title": "Family Care Conference - Vance Family",
        "description": "Meet with patient's family to discuss care plan, prognosis, and discharge planning. Social worker will attend.",
        "priority": "high",
        "scheduled_time": "2025-12-16T10:30:00Z",
        "due_time": "2025-12-16T11:30:00Z",
        "status": "pending",
        "position_x": 700,
        "position_y": 100
    },
    {
        "id": "task-maria-006",
        "shift_id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "assigned_to": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "patient_room": null,
        "patient_name": null,
        "task_type": "documentation",
        "task_subtype": "scheduling",
        "title": "Staff Schedule Review - Next Week",
        "description": "Review and finalize nursing schedule for upcoming week. Address PTO requests and ensure adequate coverage.",
        "priority": "normal",
        "scheduled_time": "2025-12-16T13:00:00Z",
        "due_time": "2025-12-16T14:00:00Z",
        "status": "pending",
        "position_x": 850,
        "position_y": 100
    },
    {
        "id": "task-maria-007",
        "shift_id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "assigned_to": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "patient_room": null,
        "patient_name": null,
        "task_type": "assessment",
        "task_subtype": "unit_walkthrough",
        "title": "Afternoon Unit Walkthrough",
        "description": "Walk through all patient rooms. Check on staff, assess patient conditions, identify any immediate needs.",
        "priority": "normal",
        "scheduled_time": "2025-12-16T14:30:00Z",
        "due_time": "2025-12-16T15:30:00Z",
        "status": "pending",
        "position_x": 1000,
        "position_y": 100
    },
    {
        "id": "task-maria-008",
        "shift_id": "65e569b3-f0b0-44dc-9ab4-5c5a57aafd36",
        "assigned_to": "2c598c6b-4738-4264-bd5a-08991dbed77e",
        "patient_room": null,
        "patient_name": null,
        "task_type": "communication",
        "task_subtype": "shift_handover",
        "title": "Evening Shift Handover",
        "description": "Provide comprehensive report to evening charge nurse. Highlight critical patients, pending tasks, and concerns.",
        "priority": "high",
        "scheduled_time": "2025-12-16T17:30:00Z",
        "due_time": "2025-12-16T18:00:00Z",
        "status": "pending",
        "position_x": 1150,
        "position_y": 100
    }
]
```

### 2. Mark Hoffner (ICU/Trauma Nurse) - Shift: 07:00-19:00, Dec 11

```json
[
    {
        "id": "task-mark-001",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-1",
        "patient_name": "James Morrison",
        "task_type": "assessment",
        "task_subtype": "neuro_check",
        "title": "Neurological Assessment - Morrison",
        "description": "Perform GCS assessment. Patient is post-MVA with TBI. Check pupil response, motor function, verbal response.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T07:00:00Z",
        "due_time": "2025-12-11T07:15:00Z",
        "status": "completed",
        "position_x": 100,
        "position_y": 200
    },
    {
        "id": "task-mark-002",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-1",
        "patient_name": "James Morrison",
        "task_type": "vitals",
        "task_subtype": "continuous_monitoring",
        "title": "Vital Signs & Ventilator Check - Morrison",
        "description": "Record vitals, check ventilator settings (PEEP, FiO2, tidal volume). Assess ETT placement and cuff pressure.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T07:15:00Z",
        "due_time": "2025-12-11T07:30:00Z",
        "status": "completed",
        "position_x": 250,
        "position_y": 200,
        "depends_on": ["task-mark-001"]
    },
    {
        "id": "task-mark-003",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-1",
        "patient_name": "James Morrison",
        "task_type": "medication",
        "task_subtype": "iv_sedation",
        "title": "Sedation Titration - Morrison",
        "description": "Assess RASS score and titrate Propofol drip. Target RASS -2 to -3. Document sedation vacation if ordered.",
        "priority": "high",
        "scheduled_time": "2025-12-11T08:00:00Z",
        "due_time": "2025-12-11T08:15:00Z",
        "status": "completed",
        "position_x": 400,
        "position_y": 200
    },
    {
        "id": "task-mark-004",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-2",
        "patient_name": "Patricia Wells",
        "task_type": "procedure",
        "task_subtype": "abg_draw",
        "title": "ABG Draw - Wells",
        "description": "Draw arterial blood gas from radial art line. Patient on BiPAP for COPD exacerbation. Compare to previous values.",
        "priority": "high",
        "scheduled_time": "2025-12-11T08:30:00Z",
        "due_time": "2025-12-11T08:45:00Z",
        "status": "completed",
        "position_x": 550,
        "position_y": 200
    },
    {
        "id": "task-mark-005",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-1",
        "patient_name": "James Morrison",
        "task_type": "medication",
        "task_subtype": "iv_medication",
        "title": "Vasopressor Adjustment - Morrison",
        "description": "Titrate Norepinephrine to maintain MAP >65. Current dose 0.1 mcg/kg/min. Assess perfusion and urine output.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T09:00:00Z",
        "due_time": "2025-12-11T09:15:00Z",
        "status": "in_progress",
        "position_x": 700,
        "position_y": 200
    },
    {
        "id": "task-mark-006",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-2",
        "patient_name": "Patricia Wells",
        "task_type": "care",
        "task_subtype": "repositioning",
        "title": "Turn & Reposition - Wells",
        "description": "Turn patient Q2H for pressure injury prevention. Assess skin integrity, apply barrier cream to sacrum.",
        "priority": "normal",
        "scheduled_time": "2025-12-11T10:00:00Z",
        "due_time": "2025-12-11T10:30:00Z",
        "status": "pending",
        "position_x": 850,
        "position_y": 200
    },
    {
        "id": "task-mark-007",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-1",
        "patient_name": "James Morrison",
        "task_type": "assessment",
        "task_subtype": "neuro_check",
        "title": "Q2H Neuro Check - Morrison",
        "description": "Repeat neurological assessment. Compare to baseline. Alert physician if GCS drops >2 points.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T11:00:00Z",
        "due_time": "2025-12-11T11:15:00Z",
        "status": "pending",
        "position_x": 1000,
        "position_y": 200,
        "depends_on": ["task-mark-001"]
    },
    {
        "id": "task-mark-008",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-1",
        "patient_name": "James Morrison",
        "task_type": "procedure",
        "task_subtype": "line_care",
        "title": "Central Line Dressing Change - Morrison",
        "description": "Change central line dressing using sterile technique. Assess insertion site for signs of infection. Document.",
        "priority": "high",
        "scheduled_time": "2025-12-11T12:00:00Z",
        "due_time": "2025-12-11T12:30:00Z",
        "status": "pending",
        "position_x": 1150,
        "position_y": 200
    },
    {
        "id": "task-mark-009",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": "ICU-2",
        "patient_name": "Patricia Wells",
        "task_type": "medication",
        "task_subtype": "nebulizer",
        "title": "Nebulizer Treatment - Wells",
        "description": "Administer Albuterol/Ipratropium nebulizer. Assess breath sounds before and after. Document response.",
        "priority": "high",
        "scheduled_time": "2025-12-11T14:00:00Z",
        "due_time": "2025-12-11T14:30:00Z",
        "status": "pending",
        "position_x": 1300,
        "position_y": 200
    },
    {
        "id": "task-mark-010",
        "shift_id": "0c316150-96fc-4a67-932d-5b59d5800b8e",
        "assigned_to": "7bd77f6c-6a63-4578-89c3-ca1efcb92518",
        "patient_room": null,
        "patient_name": null,
        "task_type": "documentation",
        "task_subtype": "charting",
        "title": "Complete ICU Flowsheet Documentation",
        "description": "Complete all ICU flowsheet entries: I&O totals, vent changes, drip rates, assessments. Prepare for shift report.",
        "priority": "high",
        "scheduled_time": "2025-12-11T18:00:00Z",
        "due_time": "2025-12-11T19:00:00Z",
        "status": "pending",
        "position_x": 1450,
        "position_y": 200
    }
]
```

### 3. Cindy Maxwell (Surgical Nurse) - Shift: 07:00-15:00, Dec 11

```json
[
    {
        "id": "task-cindy-001",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": "Pre-Op 1",
        "patient_name": "Michael Torres",
        "task_type": "assessment",
        "task_subtype": "pre_op_assessment",
        "title": "Pre-Op Assessment - Torres (Lap Chole)",
        "description": "Complete pre-operative checklist. Verify NPO status, consent signed, allergies, surgical site marking. Review labs.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T07:00:00Z",
        "due_time": "2025-12-11T07:30:00Z",
        "status": "completed",
        "position_x": 100,
        "position_y": 300
    },
    {
        "id": "task-cindy-002",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": "Pre-Op 1",
        "patient_name": "Michael Torres",
        "task_type": "medication",
        "task_subtype": "pre_op_meds",
        "title": "Administer Pre-Op Medications - Torres",
        "description": "Give pre-operative antibiotics (Cefazolin 2g IV) per protocol. Verify no allergies. Start within 60 min of incision.",
        "priority": "high",
        "scheduled_time": "2025-12-11T07:30:00Z",
        "due_time": "2025-12-11T07:45:00Z",
        "status": "completed",
        "position_x": 250,
        "position_y": 300,
        "depends_on": ["task-cindy-001"]
    },
    {
        "id": "task-cindy-003",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": "Pre-Op 2",
        "patient_name": "Sandra Kim",
        "task_type": "procedure",
        "task_subtype": "iv_insertion",
        "title": "IV Access - Kim (Knee Arthroscopy)",
        "description": "Start 18G IV in left forearm. Patient has difficult access history - may need ultrasound guidance.",
        "priority": "high",
        "scheduled_time": "2025-12-11T08:00:00Z",
        "due_time": "2025-12-11T08:20:00Z",
        "status": "completed",
        "position_x": 400,
        "position_y": 300
    },
    {
        "id": "task-cindy-004",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": "PACU Bay 3",
        "patient_name": "Michael Torres",
        "task_type": "assessment",
        "task_subtype": "post_op_assessment",
        "title": "Post-Op Recovery Assessment - Torres",
        "description": "Receive patient from OR. Assess airway, breathing, circulation. Monitor for emergence from anesthesia. Pain assessment.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T09:30:00Z",
        "due_time": "2025-12-11T10:00:00Z",
        "status": "in_progress",
        "position_x": 550,
        "position_y": 300
    },
    {
        "id": "task-cindy-005",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": "PACU Bay 3",
        "patient_name": "Michael Torres",
        "task_type": "medication",
        "task_subtype": "pain_management",
        "title": "Pain Management - Torres",
        "description": "Assess pain level (0-10 scale). Administer Morphine 2-4mg IV PRN per order. Reassess in 15 minutes.",
        "priority": "high",
        "scheduled_time": "2025-12-11T10:00:00Z",
        "due_time": "2025-12-11T10:15:00Z",
        "status": "pending",
        "position_x": 700,
        "position_y": 300,
        "depends_on": ["task-cindy-004"]
    },
    {
        "id": "task-cindy-006",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": "PACU Bay 3",
        "patient_name": "Michael Torres",
        "task_type": "procedure",
        "task_subtype": "wound_check",
        "title": "Surgical Site Check - Torres",
        "description": "Inspect laparoscopic port sites for bleeding, hematoma. Check dressing integrity. Document findings.",
        "priority": "high",
        "scheduled_time": "2025-12-11T10:30:00Z",
        "due_time": "2025-12-11T10:45:00Z",
        "status": "pending",
        "position_x": 850,
        "position_y": 300
    },
    {
        "id": "task-cindy-007",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": "PACU Bay 4",
        "patient_name": "Sandra Kim",
        "task_type": "assessment",
        "task_subtype": "post_op_assessment",
        "title": "Post-Op Recovery Assessment - Kim",
        "description": "Receive patient from OR. Assess neurovascular status of operative leg. Check nerve block effectiveness.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T11:00:00Z",
        "due_time": "2025-12-11T11:30:00Z",
        "status": "pending",
        "position_x": 1000,
        "position_y": 300
    },
    {
        "id": "task-cindy-008",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": "PACU Bay 3",
        "patient_name": "Michael Torres",
        "task_type": "communication",
        "task_subtype": "discharge_education",
        "title": "Discharge Teaching - Torres",
        "description": "Provide post-op instructions: diet progression, activity restrictions, wound care, signs of infection. Review medications.",
        "priority": "normal",
        "scheduled_time": "2025-12-11T12:00:00Z",
        "due_time": "2025-12-11T12:30:00Z",
        "status": "pending",
        "position_x": 1150,
        "position_y": 300
    },
    {
        "id": "task-cindy-009",
        "shift_id": "1ab7a29a-3be1-40ff-97b3-3b45ddf49963",
        "assigned_to": "66817e71-8d0e-4b2b-99b6-cb088a56c4d2",
        "patient_room": null,
        "patient_name": null,
        "task_type": "documentation",
        "task_subtype": "charting",
        "title": "Complete Surgical Documentation",
        "description": "Finalize all peri-operative documentation. Complete PACU scoring, discharge criteria met, patient education documented.",
        "priority": "high",
        "scheduled_time": "2025-12-11T14:00:00Z",
        "due_time": "2025-12-11T15:00:00Z",
        "status": "pending",
        "position_x": 1300,
        "position_y": 300
    }
]
```

### 4. Dimitriv Kravanoff (Emergency Department Nurse) - Shift: 07:00-18:00, Dec 11

```json
[
    {
        "id": "task-dimitriv-001",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "Triage",
        "patient_name": "Walk-in Patient",
        "task_type": "assessment",
        "task_subtype": "triage",
        "title": "Triage Assessment - Chest Pain",
        "description": "62yo male c/o chest pain x 2 hours. Perform rapid triage using ESI. Obtain 12-lead EKG stat if cardiac suspected.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T07:15:00Z",
        "due_time": "2025-12-11T07:25:00Z",
        "status": "completed",
        "position_x": 100,
        "position_y": 400
    },
    {
        "id": "task-dimitriv-002",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "ED Bay 1",
        "patient_name": "Harold Greene",
        "task_type": "procedure",
        "task_subtype": "ekg",
        "title": "12-Lead EKG - Greene",
        "description": "Obtain stat 12-lead EKG. Alert physician immediately if STEMI criteria met. Prepare for possible cath lab activation.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T07:25:00Z",
        "due_time": "2025-12-11T07:30:00Z",
        "status": "completed",
        "position_x": 250,
        "position_y": 400,
        "depends_on": ["task-dimitriv-001"]
    },
    {
        "id": "task-dimitriv-003",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "ED Bay 1",
        "patient_name": "Harold Greene",
        "task_type": "medication",
        "task_subtype": "cardiac_protocol",
        "title": "Chest Pain Protocol Meds - Greene",
        "description": "Administer Aspirin 324mg PO, start Heparin drip per protocol. Obtain troponin, BMP, CBC. Continuous cardiac monitoring.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T07:30:00Z",
        "due_time": "2025-12-11T07:45:00Z",
        "status": "completed",
        "position_x": 400,
        "position_y": 400,
        "depends_on": ["task-dimitriv-002"]
    },
    {
        "id": "task-dimitriv-004",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "ED Bay 3",
        "patient_name": "Lisa Fernandez",
        "task_type": "assessment",
        "task_subtype": "trauma_assessment",
        "title": "Secondary Survey - Fernandez (MVA)",
        "description": "28yo female MVA, restrained driver. Complete secondary trauma survey. Assess for occult injuries. C-spine precautions.",
        "priority": "high",
        "scheduled_time": "2025-12-11T08:30:00Z",
        "due_time": "2025-12-11T09:00:00Z",
        "status": "in_progress",
        "position_x": 550,
        "position_y": 400
    },
    {
        "id": "task-dimitriv-005",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "ED Bay 3",
        "patient_name": "Lisa Fernandez",
        "task_type": "procedure",
        "task_subtype": "blood_draw",
        "title": "Trauma Labs - Fernandez",
        "description": "Draw trauma panel: Type & Screen, CBC, CMP, coags, lactate, lipase. Prepare for possible CT scan.",
        "priority": "high",
        "scheduled_time": "2025-12-11T09:00:00Z",
        "due_time": "2025-12-11T09:15:00Z",
        "status": "pending",
        "position_x": 700,
        "position_y": 400,
        "depends_on": ["task-dimitriv-004"]
    },
    {
        "id": "task-dimitriv-006",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "ED Bay 5",
        "patient_name": "Tommy Chen",
        "task_type": "assessment",
        "task_subtype": "pediatric_assessment",
        "title": "Pediatric Assessment - Chen (Fever)",
        "description": "4yo male with fever 103.2F x 3 days. Assess hydration status, check for rash, meningeal signs. Weight-based dosing.",
        "priority": "high",
        "scheduled_time": "2025-12-11T10:00:00Z",
        "due_time": "2025-12-11T10:30:00Z",
        "status": "pending",
        "position_x": 850,
        "position_y": 400
    },
    {
        "id": "task-dimitriv-007",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "ED Bay 5",
        "patient_name": "Tommy Chen",
        "task_type": "medication",
        "task_subtype": "antipyretic",
        "title": "Administer Antipyretic - Chen",
        "description": "Give Acetaminophen 15mg/kg PO (weight: 18kg = 270mg). Recheck temp in 1 hour. Encourage oral fluids.",
        "priority": "normal",
        "scheduled_time": "2025-12-11T10:30:00Z",
        "due_time": "2025-12-11T10:45:00Z",
        "status": "pending",
        "position_x": 1000,
        "position_y": 400,
        "depends_on": ["task-dimitriv-006"]
    },
    {
        "id": "task-dimitriv-008",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "ED Bay 2",
        "patient_name": "Margaret Wilson",
        "task_type": "procedure",
        "task_subtype": "wound_care",
        "title": "Laceration Repair Assist - Wilson",
        "description": "Assist physician with 5cm forearm laceration repair. Prepare suture tray, local anesthetic. Tetanus status check.",
        "priority": "normal",
        "scheduled_time": "2025-12-11T11:30:00Z",
        "due_time": "2025-12-11T12:00:00Z",
        "status": "pending",
        "position_x": 1150,
        "position_y": 400
    },
    {
        "id": "task-dimitriv-009",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "ED Bay 1",
        "patient_name": "Harold Greene",
        "task_type": "communication",
        "task_subtype": "transfer_report",
        "title": "Transfer Report to Cath Lab - Greene",
        "description": "Provide SBAR report to cath lab team. Include all cardiac workup results, current drips, IV access, allergies.",
        "priority": "critical",
        "scheduled_time": "2025-12-11T13:00:00Z",
        "due_time": "2025-12-11T13:15:00Z",
        "status": "pending",
        "position_x": 1300,
        "position_y": 400
    },
    {
        "id": "task-dimitriv-010",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": "Triage",
        "patient_name": "Multiple",
        "task_type": "assessment",
        "task_subtype": "triage",
        "title": "Afternoon Triage Coverage",
        "description": "Cover triage desk 14:00-16:00. Rapid assessment of walk-ins, ESI scoring, vital signs, chief complaint documentation.",
        "priority": "high",
        "scheduled_time": "2025-12-11T14:00:00Z",
        "due_time": "2025-12-11T16:00:00Z",
        "status": "pending",
        "position_x": 1450,
        "position_y": 400
    },
    {
        "id": "task-dimitriv-011",
        "shift_id": "9b3a001c-aead-45ba-a2aa-9fba5241e809",
        "assigned_to": "38765599-bf71-4fdc-9578-4f307f51a1ff",
        "patient_room": null,
        "patient_name": null,
        "task_type": "documentation",
        "task_subtype": "charting",
        "title": "Complete ED Documentation",
        "description": "Finalize all patient charts. Ensure discharge instructions documented, follow-up appointments scheduled, prescriptions sent.",
        "priority": "high",
        "scheduled_time": "2025-12-11T17:00:00Z",
        "due_time": "2025-12-11T18:00:00Z",
        "status": "pending",
        "position_x": 1600,
        "position_y": 400
    }
]
```

---

## Frontend Implementation Plan

### React Flow Integration

1. **Node Types** - Custom nodes for each task category with color coding
2. **Edge Types** - Dependency arrows showing task flow
3. **Layout** - Timeline-based horizontal layout grouped by patient
4. **Interactions** - Click to view details, drag to reschedule, status toggles

### Components Needed

-   `TaskNode` - Custom React Flow node component
-   `TaskPanel` - Side panel for task details/editing
-   `ShiftTimeline` - Timeline header component
-   `TaskFilters` - Filter by status, priority, patient, type

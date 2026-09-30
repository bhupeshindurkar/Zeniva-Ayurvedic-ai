export const DEFAULT_ZENIVA_TEAM_DATA = {
  founder: {
    id: 'founder',
    name: 'Bhupesh Indurkar',
    title: 'Founder, Lead System Architect & Project Director',
    roleTag: 'Project Founder & Chief Architect',
    bio: 'Visionary behind Zeniva AI, dedicated to architecting production-grade healthcare intelligence, automated doctor council verification, and accessible multi-portal ecosystems. Engineered the complete end-to-end fullstack platform connecting React, FastAPI, and clinical SQLite databases.',
    email: 'bhupesh_it@tgpcet.com',
    linkedin: 'https://www.linkedin.com/in/bhupesh-indurkar/',
    avatar: '/team/bhupesh.jpg',
    category: 'architecture',
    college: 'TGPCET Nagpur (IT Dept)',
    keyResponsibilities: [
      'Platform Conception & Strategic Vision for AI Ayurvedic Care',
      'Multi-Portal Architecture (Patient, Doctor, Super Admin Sync)',
      'Medical Council Compliance & Doctor Verification Pipeline',
      'Super Admin Governance Framework & Role-Based Access Control',
      'End-to-End Full-Stack Integration between React & FastAPI'
    ],
    skills: ['System Architecture', 'Clinical Compliance', 'Full-Stack Integration', 'Team Leadership', 'Security Governance']
  },
  members: [
    {
      id: 'dhrup',
      name: 'Dhrup Sonkar',
      role: 'Lead AI & LLM Integration Specialist',
      category: 'ai',
      badge: 'AI & LLM Integration Lead',
      bio: 'Spearheaded Large Language Model (LLM) integration, prompt architecture, and Ayurvedic RAG intelligence pipelines.',
      email: 'parthsonkar2006@gmail.com',
      linkedin: 'https://www.linkedin.com/in/dhrup-sonkar-15b500320/',
      avatar: '/team/dhrup.jpg',
      college: 'TGPCET Nagpur (IT Dept)',
      contributions: [
        'Integrated 70B LLM models and neural reasoning pipelines for 24/7 AI Ayurvedic Doctor consultations',
        'Engineered context-rich Charaka & Sushruta retrieval-augmented generation (RAG) vector embeddings',
        'Built multimodal vision diagnostic triage endpoints for clinical skin symptom analysis',
        'Formulated clinical safety guardrails preventing AI hallucination and validating dosage accuracy'
      ],
      tags: ['LLM Integration', 'Gemini & Llama', 'RAG Pipelines', 'Prompt Architecture', 'Neural AI']
    },
    {
      id: 'vivek',
      name: 'Vivek Rathod',
      role: 'Lead Software Testing & Quality Assurance Engineer',
      category: 'qa',
      badge: 'Software QA & Testing Lead',
      bio: 'Leading rigorous software quality assurance, test case automation, regression suites, and multi-portal stability.',
      email: 'rathodvivek814@gmail.com',
      linkedin: 'https://www.linkedin.com/in/vivek-rathod-a676432b1',
      avatar: '/team/vivek.jpg',
      college: 'TGPCET Nagpur (IT Dept)',
      contributions: [
        'Executed end-to-end software test suites across Patient, Doctor, and Super Admin portals',
        'Conducted comprehensive regression, functional boundary, and API payload verification testing',
        'Identified, documented, and validated bug fixes ensuring zero-crash clinical reliability',
        'Verified cross-portal state isolation between SQLite database records and local storage'
      ],
      tags: ['Software Testing', 'QA Automation', 'Regression Testing', 'Bug Tracking', 'Test Case Design']
    },
    {
      id: 'momita',
      name: 'Momita Lande',
      role: 'Lead Frontend UI/UX Designer & Product Experience',
      category: 'frontend',
      badge: 'Creative UI/UX & Design Systems Lead',
      bio: 'Crafting aesthetically refined, spiritually resonant Vedic digital experiences with state-of-the-art responsiveness.',
      email: 'momitalande06@gmail.com',
      linkedin: 'https://www.linkedin.com/in/momita-lande-812bb332b',
      avatar: '/team/momita.jpg',
      college: 'TGPCET Nagpur (IT Dept)',
      contributions: [
        'Designed the signature Vedic aesthetic theme, harmonious color tokens, and golden visual elements',
        'Crafted responsive layout architectures, micro-animations, and glassmorphic dashboard cards',
        'Designed intuitive navigation workflows for Patient, Doctor, and Super Admin portals',
        'Optimized mobile, tablet, and desktop viewports for clean, accessible healthcare interactions'
      ],
      tags: ['UI/UX Design', 'Tailwind CSS', 'Responsive Layout', 'Design Systems', 'Figma Prototyping']
    },
    {
      id: 'shreya',
      name: 'Shreya Satpute',
      role: 'Database Architect & Clinical Data Systems Engineer',
      category: 'database',
      badge: 'Database Architecture & Data Lead',
      bio: 'Architecting scalable database schemas, electronic health records (EHR) data models, and clinical datasets.',
      email: 'shreya050404@gmail.com',
      linkedin: 'https://www.linkedin.com/in/shreya-satpute-71a724339',
      avatar: '/team/shreya.jpg',
      college: 'TGPCET Nagpur (IT Dept)',
      contributions: [
        'Designed and structured SQLite relational schemas for patients, doctors, appointments, and reviews',
        'Architected electronic health records (EHR) models, consultation logs, and medical history tables',
        'Implemented database indexing, query optimization, and dynamic column migration safety',
        'Structured comprehensive clinical formulation catalogs and herb-symptom relationship mappings'
      ],
      tags: ['Database Architecture', 'SQLite Schema', 'Data Modeling', 'EHR Systems', 'Query Optimization']
    },
    {
      id: 'sachin',
      name: 'Sachin Limbule',
      role: 'Lead Website & Web Performance Testing Engineer',
      category: 'qa',
      badge: 'Website Testing & Security QA Lead',
      bio: 'Ensuring cross-browser compatibility, web usability audits, load performance, and web security compliance.',
      email: 'sachinlimbule38@gmail.com',
      linkedin: 'https://www.linkedin.com/in/sachin-limbule-21b04b3a2/',
      avatar: '/team/sachin.jpg',
      college: 'TGPCET Nagpur (IT Dept)',
      contributions: [
        'Conducted comprehensive web usability and cross-browser compatibility audits across major browsers',
        'Tested web security barriers, authentication flows, and privileged Super Admin route gateways',
        'Performed lighthouse web performance benchmarks, asset load optimizations, and latency testing',
        'Validated live consultation booking, image upload forms, and responsive mobile interactions'
      ],
      tags: ['Website Testing', 'Web Security', 'Cross-Browser QA', 'Performance Audits', 'Usability Testing']
    }
  ]
};

import { supabase } from '../lib/supabase';

export const getTeamData = () => {
  try {
    const saved = localStorage.getItem('zeniva_team_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.founder && Array.isArray(parsed.members)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading zeniva_team_config:', e);
  }
  return DEFAULT_ZENIVA_TEAM_DATA;
};

// Fetch real-time live Team Data from Supabase Cloud + Backend SQLite (Cross-Device & Mobile Sync)
export const fetchRemoteTeamData = async () => {
  try {
    // 1. Query Supabase universal cloud store
    if (supabase) {
      const { data, error } = await supabase
        .from('doctor_reviews')
        .select('review_notes')
        .eq('patient_name', 'ZENIVA_TEAM_CONFIG')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0].review_notes) {
        try {
          const parsed = JSON.parse(data[0].review_notes);
          if (parsed && parsed.founder && Array.isArray(parsed.members)) {
            localStorage.setItem('zeniva_team_config', JSON.stringify(parsed));
            window.dispatchEvent(new CustomEvent('zeniva_team_updated', { detail: parsed }));
            return parsed;
          }
        } catch (parseErr) { }
      }
    }

    // 2. Query FastAPI Backend SQLite if available
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const backendData = await res.json();
        if (backendData && backendData.founder && Array.isArray(backendData.members)) {
          localStorage.setItem('zeniva_team_config', JSON.stringify(backendData));
          window.dispatchEvent(new CustomEvent('zeniva_team_updated', { detail: backendData }));
          return backendData;
        }
      }
    } catch (e) { }

  } catch (err) {
    console.warn('Cloud team sync notice:', err);
  }

  return getTeamData();
};

// Save Team Data permanently across Supabase Cloud, Backend SQLite, and LocalStorage
export const saveTeamData = async (teamData) => {
  try {
    // 1. Instant local storage & event broadcast for sub-second UI response
    localStorage.setItem('zeniva_team_config', JSON.stringify(teamData));
    window.dispatchEvent(new CustomEvent('zeniva_team_updated', { detail: teamData }));

    // 2. Persist to Supabase Cloud so mobile phones and all visitors see changes instantly
    try {
      if (supabase) {
        await supabase
          .from('doctor_reviews')
          .insert([{
            doctor_name: 'Zeniva Super Admin',
            patient_name: 'ZENIVA_TEAM_CONFIG',
            symptoms: 'Zeniva Core Team Global Synchronization',
            review_notes: JSON.stringify(teamData),
            status: 'reviewed'
          }]);
      }
    } catch (sbErr) {
      console.warn('Supabase team save notice:', sbErr);
    }

    // 3. Persist to backend SQLite
    try {
      await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
    } catch (apiErr) { }

    return true;
  } catch (e) {
    console.error('Error saving zeniva_team_config:', e);
    return false;
  }
};

export const resetTeamData = async () => {
  try {
    localStorage.removeItem('zeniva_team_config');
    localStorage.removeItem('zeniva_team_avatars');
    window.dispatchEvent(new CustomEvent('zeniva_team_updated', { detail: DEFAULT_ZENIVA_TEAM_DATA }));

    // Save default back to Supabase
    try {
      if (supabase) {
        await supabase
          .from('doctor_reviews')
          .insert([{
            doctor_name: 'Zeniva Super Admin',
            patient_name: 'ZENIVA_TEAM_CONFIG',
            symptoms: 'Zeniva Core Team Reset to TGPCET Defaults',
            review_notes: JSON.stringify(DEFAULT_ZENIVA_TEAM_DATA),
            status: 'reviewed'
          }]);
      }
    } catch (sbErr) { }

    return DEFAULT_ZENIVA_TEAM_DATA;
  } catch (e) {
    console.error('Error resetting zeniva_team_config:', e);
    return DEFAULT_ZENIVA_TEAM_DATA;
  }
};

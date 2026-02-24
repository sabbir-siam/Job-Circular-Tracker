import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { JobCircular, JobCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CATEGORIES: Record<string, JobCategory> = {
  'Engineering': 'Engineering',
  'Power & Energy': 'Power & Energy',
  'Transportation': 'Transportation',
  'Ports': 'Ports',
  'Urban Development': 'Urban Development',
  'Finance': 'Finance'
};

const ORGS_BY_CATEGORY = {
  'Engineering': 'LGED (lged.gov.bd), BWDB (bwdb.gov.bd), RHD (rhd.gov.bd), PWD (pwd.gov.bd), DPHE (dphe.gov.bd)',
  'Power & Energy': 'BPDB (bpdb.gov.bd), PGCB (pgcb.gov.bd), DESCO (desco.gov.bd), DPDC (dpdc.gov.bd), Petrobangla (petrobangla.org.bd)',
  'Transportation': 'Bangladesh Railway (railway.gov.bd), CAAB (caab.gov.bd), BBA (bba.gov.bd), DMTCL (dmtcl.gov.bd)',
  'Ports': 'Chittagong Port (cpa.gov.bd), Mongla Port (mpa.gov.bd), BIWTA (biwta.gov.bd)',
  'Urban Development': 'RAJUK (rajuk.gov.bd), DNCC (dncc.gov.bd), DSCC (dscc.gov.bd), WASA (dwasa.org.bd)',
  'Finance': 'Bangladesh Bank (erecruitment.bb.org.bd), BPSC (bpsc.gov.bd), BEPZA (bepza.gov.bd)'
};

export async function fetchLatestCirculars(): Promise<JobCircular[]> {
  const sourceUrl = "https://biddabari.com/job-circular";
  const portals = [
    "https://alljobs.teletalk.com.bd",
    "https://bdjobs.com",
    "https://bpsc.gov.bd"
  ];
  const newsSources = [
    "https://www.prothomalo.com/chakri",
    "https://samakal.com/chakri",
    "https://www.ittefaq.com.bd/jobs",
    "http://dailyinqilab.com"
  ];

  const prompt = `
    Act as an Expert Career Coordinator for Bangladeshi Engineering and Government jobs.
    
    CRITICAL TASK: Extract ALL active job circulars from:
    1. Primary Aggregator: ${sourceUrl}
    2. Portals: ${portals.join(', ')}
    3. Newspaper Job Sections: ${newsSources.join(', ')}
    4. Specific Organizations:
    ${Object.entries(ORGS_BY_CATEGORY).map(([cat, orgs]) => `- ${cat}: ${orgs}`).join('\n')}

    For the "Engineering" sector, ensure all CIVIL ENGINEERING related jobs are captured, including those that accept Civil Engineering along with other engineering branches (e.g., Civil/Electrical/Mechanical combinations).

    For EVERY circular found, extract:
    1. Organization Name & Department
    2. Post Name
    3. Total Vacancies
    4. Educational Requirements
    5. Application Deadline (YYYY-MM-DD)
    6. Official Application Link
    7. Key Documents/Requirements
    8. Category (one of: Engineering, Power & Energy, Transportation, Ports, Urban Development, Finance, Other)

    Return a JSON array of objects with keys: organization, department, postName, vacancies, requirements, deadline, link, documents (array), category.
    Only include ONGOING circulars (deadline in the future).
    Today's date is ${new Date().toISOString().split('T')[0]}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } // Faster refresh
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);
    
    return rawData.map((item: any, index: number) => {
      const deadlineDate = new Date(item.deadline);
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: `job-${index}-${Date.now()}`,
        ...item,
        isUrgent: diffDays >= 0 && diffDays <= 7,
        postedDate: new Date().toISOString().split('T')[0]
      };
    });
  } catch (error) {
    console.error("Error fetching circulars:", error);
    return [];
  }
}

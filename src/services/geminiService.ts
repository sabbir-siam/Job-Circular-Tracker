import { GoogleGenAI } from "@google/genai";
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
  'Engineering': 'LGED, BWDB, RHD, PWD, DPHE',
  'Power & Energy': 'BPDB, PGCB, DESCO, DPDC, Petrobangla',
  'Transportation': 'Railway, CAAB, BBA, DMTCL',
  'Ports': 'CPA, MPA, BIWTA',
  'Urban Development': 'RAJUK, DNCC, DSCC, WASA',
  'Finance': 'Bangladesh Bank, E-recruitment'
};

export async function fetchLatestCirculars(): Promise<JobCircular[]> {
  const prompt = `
    Act as an Expert Career Coordinator for Bangladeshi Engineering and Government jobs.
    Search for the latest active job circulars (recruitment notices) from the following organizations in Bangladesh:
    ${Object.entries(ORGS_BY_CATEGORY).map(([cat, orgs]) => `- ${cat}: ${orgs}`).join('\n')}

    For each circular found, extract:
    1. Organization Name & Department
    2. Post Name (e.g., Assistant Engineer)
    3. Total Vacancies
    4. Educational Requirements
    5. Application Deadline (Last Date)
    6. Official Application Link
    7. Key Documents/Requirements
    8. Category (one of: Engineering, Power & Energy, Transportation, Ports, Urban Development, Finance)

    Return the data as a JSON array of objects. 
    Each object must have these keys: organization, department, postName, vacancies, requirements, deadline, link, documents (array), category.
    Only include active circulars where the deadline has not passed.
    Today's date is ${new Date().toISOString().split('T')[0]}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
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

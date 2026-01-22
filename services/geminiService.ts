
import { GoogleGenAI, Type } from "@google/genai";
import { MindMapData, MindNode, MindEdge, MindMapChangeProposal, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Processes user input to determine if it's a question or a piece of data to add.
 */
export async function processBrainInput(input: string, currentMap: MindMapData): Promise<{
  reply: string;
  suggestedChanges?: MindMapChangeProposal;
}> {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are the 'Digital Twin Brain' processor. Your goal is to help the user organize their life and thoughts.
    Analyze the user input and the current mind map context carefully.
    
    CRITICAL RULES FOR MIND MAP UPDATES:
    1. NEVER create a node without a corresponding edge to connect it to the existing tree. Disconnected nodes drift away and confuse the user.
    2. ALWAYS prioritize updating existing nodes over creating new ones. If the user talks about a topic already on the map (e.g., 'Health', 'Supplement Plan'), use 'nodesToUpdate' instead of 'nodesToAdd'.
    3. If you must add a node, pick the most logical parent ID from the existing map and add an entry in 'edgesToAdd'.
    4. Significant categories should have a relevant emoji in the 'icon' field.
    5. Provide a crisp explanation of why you made these changes.
    
    CURRENT MIND MAP STATE:
    Nodes: ${JSON.stringify(currentMap.nodes.map(n => ({ id: n.id, label: n.label, type: n.type })))}
    Edges: ${JSON.stringify(currentMap.edges.map(e => ({ source: e.source, target: e.target })))}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: input,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING, description: "Direct answer to the user." },
          suggestedChanges: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              nodesToAdd: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['concept', 'task', 'person', 'event', 'resource'] },
                    icon: { type: Type.STRING, description: "A relevant emoji for the node if significant." },
                    description: { type: Type.STRING },
                    date: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                  },
                  required: ["id", "label", "type"]
                }
              },
              nodesToUpdate: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                  }
                }
              },
              edgesToAdd: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                    label: { type: Type.STRING }
                  }
                }
              }
            }
          }
        },
        required: ["reply"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { reply: response.text };
  }
}

/**
 * Extracts tasks from the mind map.
 */
export async function extractTasksFromMindMap(currentMap: MindMapData): Promise<Task[]> {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Scan this mind map data and extract all items that represent tasks, reminders, or dated activities.
    Include anything with a 'date', 'reminderDate', or type 'task'.
    MindMap: ${JSON.stringify(currentMap)}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            reminderDate: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
            completed: { type: Type.BOOLEAN },
            nodeId: { type: Type.STRING }
          },
          required: ["id", "title", "urgency", "completed", "nodeId"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Task extraction failed to parse JSON:", e);
    return [];
  }
}

export async function generateMindMapUpdate(text: string, currentMap: MindMapData) {
    // Placeholder
}

import { MCTManager } from '../MCTManager';
import { fetchData } from '../utils/fetchData';
import { ENDPOINTS } from './endpoints';

export const generateLCID = async (): Promise<string> => {
  const response = await fetchData<{ result: { lcid: string } }>(ENDPOINTS.lcid, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: 'NewEnquiry',
      input: {
        lcid: MCTManager.getLCID(),
        icid: MCTManager.getICID(),
        partnerId: '',
        partnerName: '',
      },
    }),
  });

  if (!response?.result?.lcid) throw new Error('Failed to generate LCID');
  return response.result.lcid;
};

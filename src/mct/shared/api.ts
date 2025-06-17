export const generateLCID = async (): Promise<string> => {
  //   const respose = await fetch('/api/generate-lcid');
  //   const data = await respose.json();

  //   if (!data?.lcid) throw new Error('Failed to generate LCID');

  const data = {
    lcid: '0FFA8FAE-1D74-45BE-9CDC-9FAF7783CA07',
  };

  return data.lcid;
};

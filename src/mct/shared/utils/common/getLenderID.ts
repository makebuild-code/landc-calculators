export const getLenderID = (lenderString: string, type: 'master' | 'residential' | 'btl'): string | undefined => {
  // regex to get the master lender id, residential lender id, and btl lender id from the lender id given the format MasterLenderID:123|ResidentialLenderID:456|BTLLenderID:789
  const regex = /MasterLenderID:(\d+)\|ResidentialLenderID:(\d+)\|BTLLenderID:(\d+)/;
  const match = lenderString.match(regex);
  if (!match) return undefined;

  switch (type) {
    case 'master':
      return match[1];
    case 'residential':
      return match[2];
    case 'btl':
      return match[3];
    default:
      return match[1];
  }
};

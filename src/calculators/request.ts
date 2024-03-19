const API_ENDPOINT = 'https://landc-website.azurewebsites.net/api/calculatorhttptrigger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function request(calculator: string, input: any) {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  const body = JSON.stringify({ calculator, input });

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`API responded with status ${response.status}`);
  }

  return response.json();
}

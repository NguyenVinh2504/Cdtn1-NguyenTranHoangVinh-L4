import { request } from './client';

export async function fetchTechnicians(params = {}) {
  const query = new URLSearchParams();
  if (params.centerId) query.append('centerId', params.centerId);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const result = await request(`/api/technicians${qs}`);
  return result?.data || [];
}

export async function fetchCandidatesForTicket(ticketId) {
  const result = await request(`/api/technicians/candidates-for-ticket/${ticketId}`);
  return result?.data;
}


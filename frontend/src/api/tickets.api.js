import { request } from './client';

export async function fetchUnassignedTickets(params = {}) {
  const query = new URLSearchParams();
  if (params.centerId) query.append('centerId', params.centerId);
  if (params.priority) query.append('priority', params.priority);
  if (params.categoryId) query.append('categoryId', params.categoryId);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const result = await request(`/api/tickets/unassigned${qs}`);
  return result?.data || [];
}

export async function fetchTechnicianTickets(params = {}) {
  const query = new URLSearchParams();
  if (params.technicianId) query.append('technicianId', params.technicianId);
  if (params.status) query.append('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const result = await request(`/api/tickets/technician/mine${qs}`);
  return result?.data || [];
}

export async function fetchTicketDetail(ticketId) {
  const result = await request(`/api/tickets/${ticketId}`);
  return result?.data;
}

export async function assignTechnician(ticketId, { technicianId, note }) {
  const result = await request(`/api/tickets/${ticketId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ technicianId, note })
  });
  return result?.data;
}

export async function transitionTicketStatus(ticketId, { status, note }) {
  const result = await request(`/api/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note })
  });
  return result?.data;
}

export async function scheduleAppointment(ticketId, { appointmentAt, appointmentStatus }) {
  const result = await request(`/api/tickets/${ticketId}/appointment`, {
    method: 'POST',
    body: JSON.stringify({ appointmentAt, appointmentStatus })
  });
  return result?.data;
}

export async function createTicket(ticketData) {
  const result = await request(`/api/tickets`, {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
  return result?.data;
}

export async function deleteTicket(ticketId, reason) {
  const result = await request(`/api/tickets/${ticketId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason })
  });
  return result;
}


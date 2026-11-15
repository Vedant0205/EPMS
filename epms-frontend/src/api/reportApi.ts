import api from './axiosConfig';

export const reportApi = {
  downloadStudentPdf: async (studentId: number) => {
    const res = await api.get(`/reports/student/${studentId}/pdf`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Student_Report_${studentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadClassAttendanceExcel: async (classId: number) => {
    const res = await api.get(`/reports/class/${classId}/attendance/excel`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Class_Attendance_${classId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

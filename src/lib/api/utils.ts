export function unwrapData<T = any>(payload: any, fallback: T): T {
  if (payload?.data?.data !== undefined) return payload.data.data as T;
  if (payload?.data !== undefined) return payload.data as T;
  if (payload !== undefined && payload !== null) return payload as T;
  return fallback;
}

export function unwrapArray<T = any>(payload: any): T[] {
  const root = unwrapData<any>(payload, []);
  if (Array.isArray(root)) return root as T[];
  if (Array.isArray(root?.data)) return root.data as T[];
  if (Array.isArray(root?.items)) return root.items as T[];
  if (Array.isArray(root?.children)) return root.children as T[];
  if (Array.isArray(root?.students)) return root.students as T[];
  return [];
}

export function normalizeChild(raw: any) {
  const student = raw?.student || {};
  const studentUser = student?.user || {};
  const userId = raw?.userId || student?.userId || studentUser?.id || raw?.studentUserId;
  const attendance = raw?.attendance;
  const academics = raw?.academics;

  return {
    ...raw,
    id: raw?.studentId || raw?.id || userId,
    userId,
    name: raw?.name || studentUser?.name || student?.name || 'Unknown',
    studentCode: raw?.studentCode || student?.studentCode || student?.studentId || 'N/A',
    className: raw?.className || student?.className || raw?.class?.name || 'N/A',
    section: raw?.section || student?.section || raw?.sectionName || 'N/A',
    relation: raw?.relation || 'Parent',
    attendance: String(raw?.attendanceRate ?? attendance?.rate ?? raw?.attendance ?? 0),
    presentDays: raw?.presentDays ?? attendance?.presentDays ?? 0,
    totalDays: raw?.totalDays ?? attendance?.totalDays ?? 0,
    upcomingExams: raw?.upcomingExams ?? 0,
    overallGrade: raw?.overallGrade || academics?.grade || raw?.latestGrade || 'N/A',
    feeBalance: Number(raw?.feeBalance ?? raw?.balance ?? 0),
    totalPaid: Number(raw?.totalPaid ?? 0),
    totalDue: Number(raw?.totalDue ?? 0),
    photoUrl: raw?.photoUrl || studentUser?.avatarUrl || studentUser?.photoUrl || null,
    avatarUrl: raw?.avatarUrl || studentUser?.avatarUrl || null,
    homeroomTeacher: raw?.homeroomTeacher || null,
  };
}

export function normalizeAssignments(payload: any) {
  const root = unwrapData<any>(payload, payload);
  if (Array.isArray(root)) return root;

  const subjectAssignments = Array.isArray(root?.subjectAssignments)
    ? root.subjectAssignments.map((a: any) => ({
        ...a,
        type: 'subject',
        subject: a.subject || { id: a.subjectId, name: a.subjectName || 'Unknown Subject' },
        class: a.class || { id: a.classId, name: a.className || 'Unknown Class' },
        section: a.section || { id: a.sectionId, name: a.sectionName || 'Unknown Section' },
      }))
    : [];

  const homeroomAssignments: any[] = [];
  const homeroomSource = root?.homeroomAssignments || root?.homeroomSections || [];
  if (Array.isArray(homeroomSource)) {
    for (const item of homeroomSource) {
      const cls = item.class || { id: item.classId, name: item.className || 'Unknown Class' };
      const section = item.section || { id: item.sectionId || item.id, name: item.sectionName || item.name || 'A' };
      if (!cls?.id || !section?.id) continue;

      if (Array.isArray(item.subjects) && item.subjects.length > 0) {
        for (const entry of item.subjects) {
          const subject = entry.subject || { id: entry.subjectId, name: entry.subjectName || 'Homeroom' };
          homeroomAssignments.push({
            id: `homeroom-${section.id}-${subject.id}`,
            subject,
            class: cls,
            section,
            type: 'homeroom',
            isHomeroom: true,
          });
        }
      } else {
        homeroomAssignments.push({
          id: `homeroom-${section.id}`,
          subject: { id: 'homeroom', name: 'Homeroom' },
          class: cls,
          section,
          type: 'homeroom',
          isHomeroom: true,
        });
      }
    }
  }

  const deduped = new Map<string, any>();
  for (const assignment of [...subjectAssignments, ...homeroomAssignments]) {
    if (!assignment?.class?.id || !assignment?.section?.id || !assignment?.subject?.id) continue;
    const key = `${assignment.class.id}:${assignment.section.id}:${assignment.subject.id}`;
    if (!deduped.has(key)) deduped.set(key, assignment);
  }
  return Array.from(deduped.values());
}

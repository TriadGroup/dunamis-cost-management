import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [activeRole, setActiveRole] = useState(null); // 'admin', 'coord', 'leader', 'student'

    const addAuditLog = async (action, details, targetId = null) => {
        await db.audit_logs.add({
            id: `LOG_${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || currentStudent?.id || 'system',
            action,
            details,
            targetId
        });
    };

    // Real-world: This would check LocalStorage/IndexedDB for an existing session token
    useEffect(() => {
        const storedRole = localStorage.getItem('farmOps_role');
        const storedId = localStorage.getItem('farmOps_id');

        if (storedRole === 'student' && storedId) {
            db.students.get(storedId).then(std => {
                if (std) {
                    setCurrentStudent(std);
                    setActiveRole('student');
                }
            });
        }

        // Run auto-cleanup for old photos
        cleanupOldPhotos();
    }, []);

    const cleanupOldPhotos = async () => {
        // No longer needed since photos are removed, keeping empty or removing
    };




    const loginAsStudent = (student) => {
        setCurrentStudent(student);
        setActiveRole('student');
        localStorage.setItem('farmOps_role', 'student');
        localStorage.setItem('farmOps_id', student.id);
    };

    const loginAsStaff = (user) => {
        setCurrentUser(user);
        setActiveRole(user.role);
        localStorage.setItem('farmOps_role', user.role);
        localStorage.setItem('farmOps_id', user.id);
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentStudent(null);
        setActiveRole(null);
        localStorage.removeItem('farmOps_role');
        localStorage.removeItem('farmOps_id');
    };

    // Reactive Offline Queries
    const rawTasks = useLiveQuery(() => db.tasks.toArray());
    const tasks = rawTasks || [];

    const rawActivities = useLiveQuery(() => db.activities.toArray());
    const activeSession = rawActivities && rawActivities.length > 0 ? rawActivities[0] : null;

    const rawAttendance = useLiveQuery(() => db.attendance_records.toArray());
    const attendanceRecords = rawAttendance || [];

    const rawSyncEvents = useLiveQuery(() => db.sync_events.toArray());
    const syncQueue = rawSyncEvents || [];

    const rawStudents = useLiveQuery(() => db.students.toArray());
    const students = rawStudents || [];

    const rawGroups = useLiveQuery(() => db.student_groups.toArray());
    const groups = rawGroups || [];

    const rawHeadAssignments = useLiveQuery(() => db.head_assignments.toArray());
    const headAssignments = rawHeadAssignments || [];

    const rawLogs = useLiveQuery(() => db.audit_logs.orderBy('timestamp').reverse().toArray());
    const auditLogs = rawLogs || [];

    const rawUsers = useLiveQuery(() => db.users.toArray());
    const users = rawUsers || [];

    const rawAreas = useLiveQuery(() => db.areas.toArray());
    const areas = rawAreas || [];

    const getAttendanceStatus = (checkInTime, areaId) => {
        const area = areas.find(a => a.id === areaId);
        if (!area) return 'on_time';

        const { checkInStart, gracePeriod, absenceLimit } = area;
        if (!checkInStart) return 'on_time';

        const now = new Date(checkInTime);
        const [startHours, startMins] = checkInStart.split(':').map(Number);

        const startTime = new Date(now);
        startTime.setHours(startHours, startMins, 0, 0);

        const graceTime = new Date(startTime.getTime() + (gracePeriod || 0) * 60000);

        let absenceTime = null;
        if (absenceLimit) {
            const [absHours, absMins] = absenceLimit.split(':').map(Number);
            absenceTime = new Date(now);
            absenceTime.setHours(absHours, absMins, 0, 0);
        }

        if (absenceTime && now > absenceTime) return 'absent';
        if (now > graceTime) return 'late';
        return 'on_time';
    };

    // Compute real metrics from attendanceRecords (single source of truth)
    const getStudentMetrics = (studentId) => {
        const student = students.find(s => s.id === studentId);
        const records = attendanceRecords.filter(r => r.userId === studentId);

        let totalPresent = 0;
        let totalLate = 0;
        let totalAbsences = 0;

        records.forEach(record => {
            const status = getAttendanceStatus(record.checkIn.clientTimestamp, student?.areaId);
            if (status === 'on_time') totalPresent++;
            else if (status === 'late') { totalPresent++; totalLate++; }
            else if (status === 'absent') totalAbsences++;
        });

        return { totalPresent, totalLate, totalAbsences };
    };

    // --- AUTO-SYNC ENGINE ---
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Process Sync Queue whenever we are online and have items
    useEffect(() => {
        const processQueue = async () => {
            if (isOnline && syncQueue.length > 0) {
                console.log(`[SyncEngine] Tentando sincronizar ${syncQueue.length} itens...`);

                for (const event of syncQueue) {
                    try {
                        // SIMULAÇÃO: Aqui faríamos a chamada ao Firestore/API
                        await new Promise(resolve => setTimeout(resolve, 800)); // Delay para visualizarmos a barra de sync

                        console.log(`[SyncEngine] Item ${event.eventId} sincronizado com sucesso.`);

                        // Remove da fila local após sucesso "no servidor"
                        await db.sync_events.delete(event.localId);

                        // Atualiza o registro original na tabela (ex: trocar status de pending para synced)
                        if (event.eventType === 'CHECK_IN') {
                            await db.attendance_records.update(event.eventId, {
                                'antifraud.reviewStatus': 'synced'
                            });
                        }
                    } catch (error) {
                        console.error(`[SyncEngine] Erro ao sincronizar ${event.eventId}:`, error);
                    }
                }
            }
        };

        processQueue();
    }, [isOnline, syncQueue.length]); // Monitora mudança de status ou novos itens na fila

    // Field Ops Status (derived from if there is an attendance record without checkout)
    const currentAttendance = attendanceRecords.find(a => !a.checkOut);
    const fieldStatus = currentAttendance ? 'checked-in' : 'idle';

    // Actions
    const addTask = async (newTask) => {
        const id = `TSK_${Date.now()}`;
        await db.tasks.add({ id, ...newTask });

        // Auto-sync task creation too
        await db.sync_events.add({
            eventId: id,
            eventType: 'TASK_CREATE',
            status: 'pending'
        });
    };

    const toggleTaskStatus = async (taskId) => {
        const task = await db.tasks.get(taskId);
        if (task) {
            const newStatus = task.status === 'done' ? 'todo' : 'done';
            await db.tasks.update(taskId, { status: newStatus });

            await db.sync_events.add({
                eventId: taskId,
                eventType: 'TASK_UPDATE',
                status: 'pending',
                payload: { status: newStatus }
            });
        }
    };

    const addStudentGroup = async (group) => {
        await db.student_groups.add({ id: `GRP_${Date.now()}`, ...group });
    };

    const updateStudentGroups = async (studentId, groupIds) => {
        await db.students.update(studentId, { groupIds });
    };

    const updateStudentMetrics = async (studentId, metrics) => {
        await db.students.update(studentId, { metrics });
    };

    const updateAreaSettings = async (areaId, settings) => {
        await db.areas.update(areaId, settings);
        await addAuditLog('UPDATE_AREA_SETTINGS', `Atualizou configurações de check-in da área ${areaId}`, areaId);
    };

    // --- Admin Master Actions ---

    const addHead = async (headData) => {
        const id = `usr_head_${Date.now()}`;
        const newHead = { id, ...headData, role: 'head', status: 'active' };
        await db.users.add(newHead);
        await addAuditLog('CREATE_HEAD', `Criou Head ${headData.name}`, id);
        return id;
    };

    const assignHeadToArea = async (headId, areaId) => {
        const id = `ha_${Date.now()}`;
        await db.head_assignments.add({ id, headId, areaId });
        await addAuditLog('ASSIGN_HEAD', `Atribuiu Head ${headId} para Área ${areaId}`, id);
    };

    const removeHeadAssignment = async (assignmentId) => {
        const assignment = await db.head_assignments.get(assignmentId);
        if (assignment) {
            await db.head_assignments.delete(assignmentId);
            await addAuditLog('REMOVE_HEAD_ASSIGN', `Removeu vínculo de Head ${assignment.headId} da Área ${assignment.areaId}`, assignmentId);
        }
    };

    const updateHeadStatus = async (headId, status) => {
        await db.users.update(headId, { status });
        await addAuditLog('UPDATE_HEAD_STATUS', `Alterou status do Head ${headId} para ${status}`, headId);
    };

    const addArea = async (areaData) => {
        const id = `area_${Date.now()}`;
        const newArea = { id, ...areaData, status: 'active', modules: areaData.modules || { tasks: true, attendance: true } };
        await db.areas.add(newArea);
        await addAuditLog('CREATE_AREA', `Criou Área ${areaData.name}`, id);
        return id;
    };

    const updateArea = async (areaId, areaData) => {
        await db.areas.update(areaId, areaData);
        await addAuditLog('UPDATE_AREA', `Atualizou dados da Área ${areaId}`, areaId);
    };

    const createStudentDelegation = async (studentId, staffId) => {
        const student = await db.students.get(studentId);
        if (!student) throw new Error('Student not found');

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
        const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours

        await db.students.update(studentId, {
            delegationToken: code,
            delegationExpiresAt: expiresAt,
            delegatedBy: staffId
        });

        await addAuditLog('CREATE_DELEGATION', `Gerou código de delegação para aluno ${studentId}`, studentId);
        return code;
    };

    const assumeDelegation = async (studentId, code) => {
        const student = await db.students.get(studentId);
        if (!student || !student.delegationToken) return { success: false, error: 'Código inválido.' };

        if (student.delegationToken !== code) return { success: false, error: 'Código incorreto.' };

        const now = new Date();
        const expiresAt = new Date(student.delegationExpiresAt);
        if (now > expiresAt) return { success: false, error: 'Código expirado.' };

        // Create temp leader object
        const tempLeader = {
            id: student.id,
            name: `${student.name.split(' ')[0]} (Líder do Dia)`,
            role: 'coordinator', // Use coordinator or leader so they have access
            avatar: student.avatar || '👨‍🎓',
            accessScopes: [{ role: 'coordinator', areaId: student.areaId }],
            isDelegated: true,
            delegatedBy: student.delegatedBy
        };

        loginAsStaff(tempLeader);
        await addAuditLog('ASSUME_DELEGATION', `Aluno ${student.id} assumiu liderança temporária`, student.id);

        return { success: true };
    };

    const generateCheckInCode = async (areaId) => {
        const code = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit
        const generatedAt = new Date().toISOString();
        await updateAreaSettings(areaId, { checkInCode: code, checkInCodeGeneratedAt: generatedAt });
        return code;
    };

    // The Check-in Flow
    const performCheckIn = async (studentId, location) => {
        // Find activity for this student's area
        const student = await db.students.get(studentId);
        if (!student) return;

        const clientTimestamp = new Date().toISOString();

        const recordId = `ATT_${Date.now()}`;
        const record = {
            id: recordId,
            activityId: 'ACT_STUDENT_SESSION', // Generic for student sessions
            userId: studentId,
            checkIn: {
                clientTimestamp,
                locationFallback: location || null
            },
            checkOut: null,
            antifraud: { reviewStatus: 'pending' },
            authorityType: 'self_check',
        };

        await db.attendance_records.add(record);

        // Push to Sync Queue
        await db.sync_events.add({
            eventId: recordId,
            eventType: 'CHECK_IN',
            status: 'pending'
        });
    };

    const performCheckOut = async () => {
        if (currentAttendance) {
            await db.attendance_records.update(currentAttendance.id, {
                checkOut: {
                    clientTimestamp: new Date().toISOString()
                }
            });
            // Push to Sync Queue
            await db.sync_events.add({
                eventId: `${currentAttendance.id}_OUT`,
                eventType: 'CHECK_OUT',
                status: 'pending'
            });
        }
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            currentStudent,
            activeRole,
            loginAsStudent,
            loginAsStaff,
            logout,
            tasks, addTask, toggleTaskStatus,
            students, users, areas,
            groups, addStudentGroup, updateStudentGroups,
            attendanceRecords, getStudentMetrics,
            headAssignments, auditLogs,
            addHead, assignHeadToArea, removeHeadAssignment, updateHeadStatus,
            addAuditLog,
            activeSession,
            getAttendanceStatus,
            fieldStatus,
            performCheckIn, performCheckOut,
            updateAreaSettings, generateCheckInCode,
            addArea, updateArea,
            createStudentDelegation, assumeDelegation,
            syncQueue
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);

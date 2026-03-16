import Dexie from 'dexie';

// Initialize Local IndexedDB Database
export const db = new Dexie('FarmOpsDB_V2');

// Declare tables, primary keys and indexes
db.version(3).stores({
    // Global Admins/Leaders
    users: 'id, role, email',

    // Core Multi-Area Hierarchy
    areas: 'id, status',
    teams: 'id, areaId',
    student_groups: 'id, areaId',

    // Missionaries/Students (PIN based, no Firebase Auth)
    students: 'id, shortCode, teamId, areaId',

    // Operational Modules
    activities: 'id, date, teamId, areaId',
    tasks: 'id, targetId, targetType, status, dueDate, areaId',

    // Massive Global Table for Checkins
    attendance_records: 'id, areaId, teamId, studentId, date',

    // RBAC & Master Entitites
    head_assignments: 'id, headId, areaId',
    audit_logs: 'id, userId, action, timestamp',

    // Sync Queue (Write-only for the app, read by the sync engine)
    sync_events: '++localId, eventId, eventType, status',
});

// Seed Initial Mock Data for offline usage if empty
db.on('populate', async () => {
    // 1. Mock Global Users (Leaders/Admins)
    await db.users.add({
        id: 'usr_coord1',
        name: 'Rafael',
        email: 'rafael@dunamisfarm.com',
        role: 'coordinator',
        accessScopes: [{ areaId: 'area_agro_01', role: 'coordinator' }]
    });

    await db.users.add({
        id: 'usr_master_rafael',
        name: 'Admin Master',
        email: 'admin',
        role: 'admin_master',
        avatar: '👑'
    });

    await db.users.add({
        id: 'usr_head_bruno',
        name: 'Bruno Head',
        email: 'bruno@dunamisfarm.com',
        role: 'head',
        avatar: '👔'
    });

    await db.head_assignments.bulkAdd([
        { id: 'ha_1', headId: 'usr_head_bruno', areaId: 'area_agro_01' },
        { id: 'ha_2', headId: 'usr_head_bruno', areaId: 'area_com_01' }
    ]);

    await db.audit_logs.add({
        id: 'log_init',
        userId: 'system',
        action: 'SYSTEM_INIT',
        details: 'Banco de dados migrado para V3 com suporte a Admin Master.',
        timestamp: new Date().toISOString()
    });

    // 2. Mock Area
    await db.areas.add({
        id: 'area_agro_01',
        name: 'Operações Agro',
        description: 'Plantio, colheita e manutenção',
        status: 'active',
        modules: { hasTasks: true, hasChecklists: true }
    });

    await db.areas.add({
        id: 'area_com_01',
        name: 'Comunicação',
        description: 'Mídia e Eventos',
        status: 'active',
        modules: { hasTasks: false, hasChecklists: false }
    });

    // 3. Mock Teams
    await db.teams.add({
        id: 'team_manutencao_b',
        areaId: 'area_agro_01',
        name: 'Manutenção Setor B',
        leaderIds: ['usr_coord1'],
        status: 'active'
    });

    // 3b. Mock Groups
    await db.student_groups.add({
        id: 'grp_estufas',
        areaId: 'area_agro_01',
        name: 'Equipe das Estufas'
    });

    // 4. Mock Students (The PIN codes flow)
    await db.students.add({
        id: 'std_11a2b',
        areaId: 'area_agro_01',
        teamId: 'team_manutencao_b',
        shortCode: 'DF-8942',
        pinHash: '1234',
        name: 'João Missionário',
        status: 'active',
        groupIds: ['grp_estufas'],
        metrics: { totalPresent: 12, totalLate: 2, totalAbsences: 1 }
    });

    await db.students.add({
        id: 'std_maria',
        areaId: 'area_agro_01',
        teamId: 'team_manutencao_b',
        shortCode: 'DF-0001',
        pinHash: '1234',
        name: 'Maria Agro',
        status: 'active',
        groupIds: [],
        metrics: { totalPresent: 5, totalLate: 0, totalAbsences: 3 }
    });

    await db.tasks.bulkAdd([
        {
            id: 'TSK_1',
            areaId: 'area_agro_01',
            targetType: 'area',
            targetId: 'area_agro_01',
            title: 'Monitoramento de Irrigação - Geral',
            status: 'todo',
            priority: 'high',
            location: 'Fazenda Esperança',
            dueDate: 'Hoje',
            instructions: 'Ligue a bomba 2 e aguarde 15 minutos.'
        },
        {
            id: 'TSK_2',
            areaId: 'area_agro_01',
            targetType: 'individual',
            targetId: 'std_11a2b',
            title: 'Colheita Tomate - João',
            status: 'todo',
            priority: 'medium',
            location: 'Estufa 3',
            dueDate: 'Hoje',
            instructions: 'Colher apenas os bem maduros.'
        },
        {
            id: 'TSK_3',
            areaId: 'area_agro_01',
            targetType: 'group',
            targetId: 'grp_estufas',
            title: 'Limpeza Estufas (Grupo)',
            status: 'todo',
            priority: 'low',
            location: 'Estufas 1-5',
            dueDate: 'Amanhã',
            instructions: 'Remover ervas daninhas.'
        },
    ]);
});

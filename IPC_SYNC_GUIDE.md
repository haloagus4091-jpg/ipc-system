# IPC Synchronization Guide

## Overview

This guide explains how to synchronize IPC (Indeks Prestasi dan Karakter) points across all output formats (Database, PDF Preview, Excel Export, etc.) to ensure consistency.

## Problem Statement

Due to various calculation methods in different parts of the system, IPC totals might become inconsistent:
- **Database**: Stores the current IPC total in `users.ipc_total`
- **PDF Preview**: Calculates IPC from breakdown data
- **Excel Export**: Uses its own calculation logic
- **Frontend Display**: May use cached or calculated values

## Solution

### 1. Backend Synchronization System

#### Script-based Sync
```bash
cd backend
node scripts/syncIpc.js
```

This script:
- Recalculates IPC for all students using the `buildIpcCardBreakdown` function
- Updates `users.ipc_total` with the correct calculated value
- Logs all changes in `ipc_history` table
- Provides detailed summary of changes

#### API-based Sync
New API endpoints added for manual synchronization:

**Check Sync Status:**
```http
GET /api/sync/status
```
Returns list of students with IPC discrepancies.

**Sync Single Student:**
```http
POST /api/sync/student/:userId
```
Synchronizes IPC for a specific student.

**Sync All Students:**
```http
POST /api/sync/all
```
Bulk synchronizes all students with discrepancies.

### 2. Frontend Calculation Fixes

Updated all frontend components to use the **same calculation formula** as backend:

#### Formula:
```
Total IPC = Point Awal (80) 
            + Prestasi Akademik 
            + Prestasi Non-Akademik 
            + Tanggung Jawab 
            + Disiplin 
            + Kepedulian 
            + Kemandirian 
            + Spiritual 
            + Kejujuran 
            + Kepercayaan Diri 
            + Organisasi 
            + Kepanitiaan 
            + Event 
            - Pelanggaran Ringan 
            - Pelanggaran Sedang 
            - Pelanggaran Berat
```

#### Components Updated:
- `IpcReport.js` - PDF preview calculation
- `IpcPrintSheet.js` - Print sheet calculation  
- `LaporanCetak.js` - Excel and PDF export calculation
- Added `kemandirian` field that was missing in some calculations
- Added `point_awal` column in exports for transparency

### 3. Database Consistency

The `buildIpcCardBreakdown` function in `backend/utils/ipcCardBreakdown.js` is now the **single source of truth** for:
- All IPC calculations
- PDF generation
- Excel exports
- API responses

## Usage Instructions

### For Superadmins:

#### Method 1: Using API (Recommended)
1. Check sync status first:
   ```bash
   curl -X GET http://your-server/api/sync/status \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. If discrepancies found, sync all:
   ```bash
   curl -X POST http://your-server/api/sync/all \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

#### Method 2: Using Script
1. SSH into server
2. Navigate to backend directory
3. Run sync script:
   ```bash
   cd /path/to/ipc-system/backend
   node scripts/syncIpc.js
   ```

### For Developers:

When adding new features that affect IPC:
1. **Always** use `buildIpcCardBreakdown` for calculations
2. **Never** implement custom IPC calculation logic
3. **Test** against the sync status endpoint
4. **Run** the sync script after database changes

## Troubleshooting

### Issue: PDF shows different IPC than Excel

**Solution**: Run the sync script to ensure database has correct values, then regenerate exports.

### Issue: Negative IPC values

**Solution**: This is expected behavior when pelanggaran points exceed total points. The system allows negative IPC.

### Issue: Missing kemandirian field

**Solution**: The sync script and updated components now include kemandirian in calculations. Run sync to update all records.

## Best Practices

1. **Run sync after major data changes**: After bulk imports or manual database changes
2. **Check sync status regularly**: Monitor for discrepancies
3. **Use API for automation**: Integrate sync into deployment process
4. **Keep calculation logic centralized**: Always use `buildIpcCardBreakdown`

## Future Improvements

- [ ] Add scheduled auto-sync (e.g., daily cron job)
- [ ] Implement real-time sync triggers on data changes
- [ ] Add frontend sync management interface
- [ ] Create sync audit reports
- [ ] Implement rollback functionality for sync operations

## Technical Details

### IPC Calculation Constants

Located in `backend/constants/points.js`:
- Prestasi points based on juara and kategori
- Organisasi points based on jabatan
- Event points based on tingkat
- Pelanggaran points based on jenis
- Perilaku points based on karakter assessment

### Database Tables Involved

- `users` - Stores `ipc_total` and `ipc_awal`
- `prestasi` - Academic and non-academic achievements
- `organisasi` - Organization memberships
- `kepanitiaan` - Committee participation
- `event` - Event participation
- `pelanggaran` - Violations (subtract points)
- `perilaku` - Character assessments (add points)
- `ipc_history` - Audit trail of IPC changes

## Support

For issues or questions about IPC synchronization:
1. Check this guide first
2. Review sync status endpoint
3. Check ipc_history for recent changes
4. Contact system administrator with details
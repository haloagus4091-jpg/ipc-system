const express = require('express');
const router = express.Router();
const { auth, superAdminOnly } = require('../middleware/auth');
const db = require('../config/database');
const { calculateCurrentClass, shouldGraduate, getClassInfo, calculateFullClass } = require('../utils/academicYear');

/**
 * Update all students' classes based on their tahun_pelajaran
 * This should be run periodically (e.g., at the start of each academic year in July)
 */
router.post('/update-all-classes', auth, superAdminOnly, async (req, res) => {
    try {
        // Get all students with tahun_pelajaran and jurusan
        const [students] = await db.query(
            'SELECT id, tahun_pelajaran, jurusan FROM users WHERE role = ? AND tahun_pelajaran IS NOT NULL',
            ['siswa']
        );

        let updatedCount = 0;
        let graduatedCount = 0;

        for (const student of students) {
            const classInfo = getClassInfo(student.tahun_pelajaran);
            
            if (classInfo.isGraduated) {
                // Mark as graduated
                await db.query(
                    'UPDATE users SET is_graduated = 1, kelas = NULL WHERE id = ?',
                    [student.id]
                );
                graduatedCount++;
            } else if (classInfo.currentClass) {
                // Calculate full class name (X/XI/XII + jurusan)
                const newClass = calculateFullClass(student.tahun_pelajaran, student.jurusan);
                await db.query(
                    'UPDATE users SET kelas = ?, is_graduated = 0 WHERE id = ?',
                    [newClass, student.id]
                );
                updatedCount++;
            }
        }

        res.json({
            message: 'Classes updated successfully',
            updated: updatedCount,
            graduated: graduatedCount
        });
    } catch (error) {
        console.error('Error updating classes:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Get class info for a specific student
 */
router.get('/student/:id/class-info', auth, async (req, res) => {
    try {
        const [students] = await db.query(
            'SELECT id, tahun_pelajaran, kelas, is_graduated FROM users WHERE id = ? AND role = ?',
            [req.params.id, 'siswa']
        );

        if (students.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = students[0];
        const classInfo = student.tahun_pelajaran 
            ? getClassInfo(student.tahun_pelajaran)
            : { currentClass: null, isGraduated: false, enrollmentYear: null };

        res.json({
            student: {
                id: student.id,
                currentClass: student.kelas,
                isGraduated: student.is_graduated === 1
            },
            calculated: classInfo
        });
    } catch (error) {
        console.error('Error getting class info:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Manually mark a student as graduated
 */
router.post('/student/:id/graduate', auth, superAdminOnly, async (req, res) => {
    try {
        const [students] = await db.query(
            'SELECT id, nama, role FROM users WHERE id = ?',
            [req.params.id]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = students[0];
        if (student.role !== 'siswa') {
            return res.status(400).json({ message: 'Only students can be marked as graduated' });
        }

        await db.query(
            'UPDATE users SET is_graduated = 1 WHERE id = ?',
            [req.params.id]
        );

        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Mark Student Graduated', `Marked student ${student.nama} (ID: ${student.id}) as graduated`]
        );

        res.json({ message: 'Student marked as graduated successfully' });
    } catch (error) {
        console.error('Error marking student as graduated:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Reactivate a graduated student (in case of error)
 */
router.post('/student/:id/reactivate', auth, superAdminOnly, async (req, res) => {
    try {
        const [students] = await db.query(
            'SELECT id, nama, role, tahun_pelajaran, jurusan FROM users WHERE id = ?',
            [req.params.id]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = students[0];
        if (student.role !== 'siswa') {
            return res.status(400).json({ message: 'Only students can be reactivated' });
        }

        // Recalculate class when reactivating
        const newClass = calculateFullClass(student.tahun_pelajaran, student.jurusan);
        
        await db.query(
            'UPDATE users SET is_graduated = 0, kelas = ? WHERE id = ?',
            [newClass, req.params.id]
        );

        // Log activity
        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Reactivate Student', `Reactivated graduated student ${student.nama} (ID: ${student.id})`]
        );

        res.json({ message: 'Student reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating student:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Validate all students' classes and report discrepancies
 * This checks if stored class matches calculated class based on tahun_pelajaran
 */
router.get('/validate-classes', auth, superAdminOnly, async (req, res) => {
    try {
        // Get all students with tahun_pelajaran
        const [students] = await db.query(
            'SELECT id, nama, nis, tahun_pelajaran, jurusan, kelas, is_graduated FROM users WHERE role = ? AND tahun_pelajaran IS NOT NULL',
            ['siswa']
        );

        const discrepancies = [];
        const validStudents = [];

        for (const student of students) {
            const calculatedClass = calculateFullClass(student.tahun_pelajaran, student.jurusan);
            const shouldBeGraduated = shouldGraduate(student.tahun_pelajaran);

            let hasDiscrepancy = false;
            let discrepancyType = null;
            let expectedValue = null;
            let actualValue = null;

            // Check graduation status
            if (shouldBeGraduated && student.is_graduated !== 1) {
                hasDiscrepancy = true;
                discrepancyType = 'graduation_status';
                expectedValue = 'graduated (1)';
                actualValue = `is_graduated=${student.is_graduated}`;
            } else if (!shouldBeGraduated && student.is_graduated === 1) {
                hasDiscrepancy = true;
                discrepancyType = 'graduation_status';
                expectedValue = 'active (0)';
                actualValue = `is_graduated=${student.is_graduated}`;
            }

            // Check class value (only if not graduated)
            if (!shouldBeGraduated && student.kelas !== calculatedClass) {
                hasDiscrepancy = true;
                discrepancyType = 'class_value';
                expectedValue = calculatedClass;
                actualValue = student.kelas;
            }

            if (hasDiscrepancy) {
                discrepancies.push({
                    id: student.id,
                    nama: student.nama,
                    nis: student.nis,
                    tahun_pelajaran: student.tahun_pelajaran,
                    jurusan: student.jurusan,
                    discrepancyType,
                    expectedValue,
                    actualValue,
                    calculatedClass,
                    is_graduated: student.is_graduated
                });
            } else {
                validStudents.push({
                    id: student.id,
                    nama: student.nama,
                    nis: student.nis,
                    kelas: student.kelas
                });
            }
        }

        // Log validation results
        await db.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [req.user.id, 'Class Validation', `Validated ${students.length} students. Found ${discrepancies.length} discrepancies.`]
        );

        res.json({
            totalStudents: students.length,
            validCount: validStudents.length,
            discrepancyCount: discrepancies.length,
            discrepancies,
            validStudents
        });
    } catch (error) {
        console.error('Error validating classes:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Auto-fix all class discrepancies
 * This will update all students' classes to match their calculated values
 */
router.post('/fix-discrepancies', auth, superAdminOnly, async (req, res) => {
    try {
        const { dryRun = false } = req.body; // If true, only report what would be fixed without actually fixing

        // Get all students with tahun_pelajaran
        const [students] = await db.query(
            'SELECT id, nama, nis, tahun_pelajaran, jurusan, kelas, is_graduated FROM users WHERE role = ? AND tahun_pelajaran IS NOT NULL',
            ['siswa']
        );

        const fixes = [];
        let fixedCount = 0;

        for (const student of students) {
            const calculatedClass = calculateFullClass(student.tahun_pelajaran, student.jurusan);
            const shouldBeGraduated = shouldGraduate(student.tahun_pelajaran);

            let needsFix = false;
            let fixType = null;
            let oldValue = null;
            let newValue = null;

            // Check graduation status
            if (shouldBeGraduated && student.is_graduated !== 1) {
                needsFix = true;
                fixType = 'graduation_status';
                oldValue = `is_graduated=${student.is_graduated}, kelas=${student.kelas}`;
                newValue = `is_graduated=1, kelas=NULL`;
            } else if (!shouldBeGraduated && student.is_graduated === 1) {
                needsFix = true;
                fixType = 'graduation_status';
                oldValue = `is_graduated=${student.is_graduated}, kelas=${student.kelas}`;
                newValue = `is_graduated=0, kelas=${calculatedClass}`;
            }

            // Check class value (only if not graduated)
            if (!shouldBeGraduated && student.kelas !== calculatedClass) {
                needsFix = true;
                fixType = 'class_value';
                oldValue = student.kelas;
                newValue = calculatedClass;
            }

            if (needsFix) {
                fixes.push({
                    id: student.id,
                    nama: student.nama,
                    nis: student.nis,
                    fixType,
                    oldValue,
                    newValue
                });

                if (!dryRun) {
                    if (shouldBeGraduated) {
                        await db.query(
                            'UPDATE users SET is_graduated = 1, kelas = NULL WHERE id = ?',
                            [student.id]
                        );
                    } else {
                        await db.query(
                            'UPDATE users SET is_graduated = 0, kelas = ? WHERE id = ?',
                            [calculatedClass, student.id]
                        );
                    }
                    fixedCount++;
                }
            }
        }

        // Log fix results
        if (!dryRun) {
            await db.query(
                'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                [req.user.id, 'Fix Class Discrepancies', `Fixed ${fixedCount} students with class discrepancies.`]
            );
        }

        res.json({
            dryRun,
            totalStudents: students.length,
            discrepanciesFound: fixes.length,
            fixedCount: dryRun ? 0 : fixedCount,
            fixes
        });
    } catch (error) {
        console.error('Error fixing discrepancies:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

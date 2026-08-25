/**
 * Academic Year Utilities
 * Handles academic year calculations, class progression, and graduation detection
 * Academic year format: YYYY-YYYY (e.g., 2024-2025)
 * Academic year starts in July and ends in June
 */

/**
 * Validate academic year format (YYYY-YYYY)
 * @param {string} tahunPelajaran - Academic year string
 * @returns {boolean} - True if valid format
 */
function validateTahunPelajaran(tahunPelajaran) {
    if (!tahunPelajaran || typeof tahunPelajaran !== 'string') {
        return false;
    }
    
    const regex = /^\d{4}-\d{4}$/;
    if (!regex.test(tahunPelajaran)) {
        return false;
    }
    
    const [startYear, endYear] = tahunPelajaran.split('-').map(Number);
    
    // End year should be exactly startYear + 1
    if (endYear !== startYear + 1) {
        return false;
    }
    
    // Reasonable year range (2000-2100)
    if (startYear < 2000 || startYear > 2100) {
        return false;
    }
    
    return true;
}

/**
 * Get current academic year based on current date
 * Academic year: July to June
 * @returns {string} - Current academic year (YYYY-YYYY)
 */
function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 = January, 6 = July
    
    // If month is June or earlier (0-5), we're in the previous academic year
    // If month is July or later (6-11), we're in the current academic year
    const startYear = month >= 6 ? year : year - 1;
    const endYear = startYear + 1;
    
    return `${startYear}-${endYear}`;
}

/**
 * Calculate current class based on enrollment academic year
 * @param {string} enrollmentYear - Academic year when student enrolled (YYYY-YYYY)
 * @returns {string|null} - Current class (X, XI, XII) or null if graduated
 */
function calculateCurrentClass(enrollmentYear) {
    if (!enrollmentYear || !validateTahunPelajaran(enrollmentYear)) {
        return null;
    }
    
    const currentYear = getCurrentAcademicYear();
    const [enrollStart] = enrollmentYear.split('-').map(Number);
    const [currentStart] = currentYear.split('-').map(Number);
    
    const yearsSinceEnrollment = currentStart - enrollStart;
    
    // Class progression:
    // Year 0: X (10th grade)
    // Year 1: XI (11th grade)
    // Year 2: XII (12th grade)
    // Year 3+: Graduated
    
    switch (yearsSinceEnrollment) {
        case 0:
            return 'X';
        case 1:
            return 'XI';
        case 2:
            return 'XII';
        default:
            return null; // Graduated
    }
}

/**
 * Check if student should be marked as graduated
 * @param {string} enrollmentYear - Academic year when student enrolled (YYYY-YYYY)
 * @returns {boolean} - True if student should be graduated
 */
function shouldGraduate(enrollmentYear) {
    const currentClass = calculateCurrentClass(enrollmentYear);
    return currentClass === null;
}

/**
 * Get class from academic year and current date
 * @param {string} enrollmentYear - Academic year when student enrolled (YYYY-YYYY)
 * @returns {object} - Object with class info and graduation status
 */
function getClassInfo(enrollmentYear) {
    const currentClass = calculateCurrentClass(enrollmentYear);
    const isGraduated = shouldGraduate(enrollmentYear);
    
    return {
        currentClass,
        isGraduated,
        enrollmentYear,
        currentAcademicYear: getCurrentAcademicYear()
    };
}

/**
 * Calculate full class name (X/XI/XII + jurusan)
 * @param {string} enrollmentYear - Academic year when student enrolled (YYYY-YYYY)
 * @param {string} jurusan - Student program/stream (e.g., "TKJ 1", "DPIB 2", "TKR 1")
 * @returns {string|null} - Full class name (e.g., "X TKJ 1") or null if graduated
 */
function calculateFullClass(enrollmentYear, jurusan) {
    const currentClass = calculateCurrentClass(enrollmentYear);
    
    if (!currentClass) {
        return null; // Graduated
    }
    
    if (!jurusan) {
        return currentClass; // Just return class if no jurusan
    }
    
    return `${currentClass} ${jurusan}`;
}

/**
 * Generate academic year options for dropdown (last 5 years to next 5 years)
 * @returns {Array} - Array of academic year strings
 */
function getAcademicYearOptions() {
    const currentYear = new Date().getFullYear();
    const options = [];
    
    for (let i = -5; i <= 5; i++) {
        const startYear = currentYear + i;
        const endYear = startYear + 1;
        options.push(`${startYear}-${endYear}`);
    }
    
    return options;
}

module.exports = {
    validateTahunPelajaran,
    getCurrentAcademicYear,
    calculateCurrentClass,
    shouldGraduate,
    getClassInfo,
    getAcademicYearOptions,
    calculateFullClass
};

cd /home/vanou/EPI/sem5/AREA/mobile-client && awk '
BEGIN { 
    print "Coverage Report"
    print "==============================================================================="
    total_lines = 0
    covered_lines = 0
}
/^SF:/ { 
    if (current_file != "") {
        if (file_total > 0) {
            coverage = (file_covered / file_total) * 100
            printf "%-60s %5d/%5d (%6.2f%%)\n", current_file, file_covered, file_total, coverage
        }
    }
    current_file = substr($0, 4)
    sub(/^lib\//, "", current_file)
    file_total = 0
    file_covered = 0
}
/^LH:/ { 
    file_covered = substr($0, 4)
    covered_lines += file_covered
}
/^LF:/ { 
    file_total = substr($0, 4)
    total_lines += file_total
}
END {
    if (current_file != "" && file_total > 0) {
        coverage = (file_covered / file_total) * 100
        printf "%-60s %5d/%5d (%6.2f%%)\n", current_file, file_covered, file_total, coverage
    }
    print "==============================================================================="
    if (total_lines > 0) {
        total_coverage = (covered_lines / total_lines) * 100
        printf "\nTOTAL COVERAGE: %d/%d lines (%.2f%%)\n", covered_lines, total_lines, total_coverage
    }
}' coverage/lcov.info
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaItem: {
    width: '50%',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold',
    marginTop: 1,
  },
  warningBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  warningText: {
    color: '#b91c1c',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  // Continuous Flow Layout Configuration
  logsContainer: {
    flexDirection: 'column',
  },
  logCard: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  logTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  logSub: {
    fontSize: 9,
    color: '#64748b',
  },
  chartImage: {
    width: '100%',
    height: 130, // Optimized height for fitting multiple blocks seamlessly
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    objectFit: 'contain',
  },
  remarksText: {
    fontSize: 8,
    color: '#475569',
    marginTop: 4,
  },
});

export default function TripLogDocument({ form, tripData, canvasImages, totalCycleExpended, extraHours }) {
  const hasViolation = totalCycleExpended > 70;

  return (
    <Document>
      {/* A single global dynamic Page handles everything. 
        As elements are appended to the logsContainer, they stack continuously.
      */}
      <Page size="A4" style={styles.page}>
        {/* Header Block */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.title}>ELD Manifest</Text>
            <Text style={styles.subtitle}>Generated via LogiTrack ELD Planner</Text>
          </View>
        </View>

        {/* Dynamic Critical Compliance Warning Banner */}
        {hasViolation && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ CRITICAL COMPLIANCE WARNING: 70-Hour Weekly Cycle Exceeded by {extraHours.toFixed(2)} Hours.
            </Text>
          </View>
        )}

        {/* Core Metadata Segment */}
        <Text style={styles.sectionHeading}>Routing Directives & Clocks</Text>
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Origin Location</Text>
            <Text style={styles.metaValue}>{form.current_location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Before-Work Cycle Expended</Text>
            <Text style={styles.metaValue}>{parseFloat(form.current_cycle_used || 0).toFixed(1)} hrs</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Pickup Terminal</Text>
            <Text style={styles.metaValue}>{form.pickup_location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Operational Work Expended</Text>
            <Text style={styles.metaValue}>{totalCycleExpended.toFixed(1)} hrs</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Dropoff Terminal</Text>
            <Text style={styles.metaValue}>{form.dropoff_location}</Text>
          </View>
        </View>

        {/* Continuous Log Feed Section */}
        <Text style={styles.sectionHeading}>Daily Activity Graphs</Text>
        <View style={styles.logsContainer}>
          {tripData?.logs?.map((log, index) => (
            /* wrap={false} forces this block to remain unified.
              If it fits on the current page, it appends directly under the previous log.
              If it doesn't fit, the layout engine creates a new page automatically.
            */
            <View key={index} style={styles.logCard} wrap={false}>
              <View style={styles.logMeta}>
                <Text style={styles.logTitle}>Day {index + 1} — {log.date}</Text>
                <Text style={styles.logSub}>
                  Drive: {log.driving_hours}h | On-Duty: {log.total_on_duty_hours}h | {log.total_miles || 0} mi
                </Text>
              </View>
              {canvasImages[index] && <Image src={canvasImages[index]} style={styles.chartImage} />}
              <Text style={styles.remarksText}>Remarks: {log.remarks || 'None'}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
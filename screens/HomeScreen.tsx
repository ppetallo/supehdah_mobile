import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

const PINK = '#FFC1CC';
const PURPLE = '#B39DDB';
const WHITE = '#FFFFFF';
const DARK = '#333';
const LIGHT = '#F8F6FF';

export default function HomeScreen() {
  return (
    <FlatList
          data={[]} // No data, just use ListHeaderComponent
          keyExtractor={() => 'header'}
          ListHeaderComponent={<View style={styles.content}>
              {/* App Info Card */}
              <View style={styles.infoCard}>
                  <View style={styles.logoCircle}>
                      <Ionicons name="paw" size={38} color={PINK} />
                  </View>
                  <Text style={styles.title}>Welcome to SuPehDah!</Text>
                  <Text style={styles.description}>
                      Your all-in-one pet care companion. Book appointments, manage your pet’s health, and connect with trusted clinics—all in one place.
                  </Text>
              </View>

              {/* How to Use Card */}
              <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>How to use</Text>
                  <View style={styles.featureList}>
                      <View style={styles.featureItem}>
                          <Ionicons name="calendar-outline" size={22} color={PURPLE} style={styles.icon} />
                          <Text style={styles.featureText}>Book appointments with trusted clinics.</Text>
                      </View>
                      <View style={styles.featureItem}>
                          <MaterialCommunityIcons name="dog" size={22} color={PURPLE} style={styles.icon} />
                          <Text style={styles.featureText}>Manage your pet’s info and health records.</Text>
                      </View>
                      <View style={styles.featureItem}>
                          <Ionicons name="settings-outline" size={22} color={PURPLE} style={styles.icon} />
                          <Text style={styles.featureText}>Edit your profile and view appointment history.</Text>
                      </View>
                  </View>
              </View>

              {/* Calendar Card */}
              <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Calendar</Text>
                  <Calendar
                      style={styles.calendar}
                      theme={{
                          backgroundColor: WHITE,
                          calendarBackground: WHITE,
                          textSectionTitleColor: DARK,
                          selectedDayBackgroundColor: PURPLE,
                          selectedDayTextColor: WHITE,
                          todayTextColor: PINK,
                          dayTextColor: DARK,
                          arrowColor: PINK,
                          monthTextColor: DARK,
                          textMonthFontWeight: 'bold',
                          textDayFontWeight: '500',
                          textDayHeaderFontWeight: 'bold',
                          textDayFontSize: 16,
                          textMonthFontSize: 18,
                          textDayHeaderFontSize: 14,
                      }}
                      markedDates={{
                          '2024-10-08': { selected: true, selectedColor: PURPLE },
                          '2024-10-09': { selected: true, selectedColor: PURPLE },
                          '2024-10-10': { selected: true, selectedColor: PURPLE },
                          '2024-10-11': { selected: true, selectedColor: PURPLE },
                          '2024-10-12': { selected: true, selectedColor: PURPLE },
                      }} />
              </View>
          </View>} renderItem={undefined}    />
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: LIGHT,
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginBottom: 22,
    marginTop: 15,
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 5,
  },
  logoCircle: {
    backgroundColor: '#F3E5F5',
    borderRadius: 50,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 2,
    marginHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: PURPLE,
    marginBottom: 12,
  },
  featureList: {
    marginBottom: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 12,
    marginLeft: 2,
  },
  featureText: {
    fontSize: 15,
    color: DARK,
    flex: 1,
    flexWrap: 'wrap',
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
  },
});
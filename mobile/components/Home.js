import React, { useState } from "react";
import {
  Image as NativeImage,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "./MenuImage";
import { Text, TextInput } from "./Typography";
import { Icon } from "./UI";
import { forest } from "../src/warm-forest";
import { featuredRestaurants, featuredMenuCoverKeys } from "../src/featured-menus";
import { localFoodAssets } from "../src/local-food-assets";
import { homeNeeds } from "../src/home-content";
export { useAppFonts as useHomeFonts } from "../src/use-app-fonts";

export function HomeHeader({ navigate, onInfo, onProfile }) {
  return (
    <View style={h.header}>
      <Pressable onPress={() => navigate("home")} accessibilityRole="button"
        accessibilityLabel="Verifed home" style={h.brandLink}>
        <NativeImage source={require("../assets/verifed-mark.png")}
          style={h.brandMark} accessibilityLabel="Verifed carrot checkmark" />
        <Text style={h.wordmark}>Verifed</Text>
      </Pressable>
      <View style={h.headerActions}>
        <Pressable onPress={onInfo} accessibilityRole="button" accessibilityLabel="How Verifed works" style={h.iconButton}>
          <Icon name="information-circle-outline" size={23} color={forest.ink} />
        </Pressable>
        <Pressable onPress={() => navigate("favorites")} accessibilityRole="button"
          accessibilityLabel="Saved dishes" style={h.iconButton}>
          <Icon name="heart-outline" size={23} color={forest.ink} />
        </Pressable>
        <Pressable onPress={onProfile} accessibilityRole="button"
          accessibilityLabel="Open dietary profile" style={h.profileButton}>
          <Icon name="person" size={22} color={forest.green} />
        </Pressable>
      </View>
    </View>
  );
}

export function HomeTab({ selected }) {
  return (
    <View style={[h.homeTab, selected && h.homeTabSelected]}>
      <Icon name={selected ? "home" : "home-outline"} size={23}
        color={selected ? forest.lightText : forest.muted} />
      <Text style={[h.tabLabel, selected && { color: forest.lightText }]}>Home</Text>
    </View>
  );
}

export default function Home({ state, navigate, searchArea }) {
  const [query, setQuery] = useState("");
  const needs = homeNeeds(state.profile);
  const featured = featuredRestaurants(state.restaurants);
  const location = searchArea?.label || "Orlando, FL";
  function search() {
    navigate(`explore?q=${encodeURIComponent(query.trim())}`);
  }
  function coverFor(restaurant) {
    return localFoodAssets[featuredMenuCoverKeys[restaurant.slug]];
  }
  function featureTile(restaurant, compact = false) {
    const source = coverFor(restaurant);
    return (
      <Pressable
        key={restaurant.slug}
        onPress={() => navigate(`restaurant/${restaurant.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`View ${restaurant.name} menu`}
        style={({ pressed }) => [compact ? h.moreTile : h.featureTile, pressed && h.pressed]}
      >
        <View style={compact ? h.morePhotoFrame : h.featurePhotoFrame}>
          {source ? (
            <Image source={source} contentFit="contain"
              accessibilityLabel={`Example menu food from ${restaurant.name}`}
              style={h.foodPhoto} />
          ) : <Icon name="restaurant-outline" size={36} color={forest.green} />}
        </View>
        <View style={compact ? h.moreCaption : h.featureCaption}>
          <Text numberOfLines={2} style={compact ? h.moreName : h.featureName}>{restaurant.name}</Text>
          {!compact && <Icon name="arrow-forward" size={17} color={forest.lightText} />}
        </View>
      </Pressable>
    );
  }
  return (
    <View style={h.page}>
      <View style={h.search}>
        <Icon name="search-outline" size={20} color={forest.muted} />
        <TextInput
          accessibilityLabel="Find restaurants, dishes or cuisines"
          placeholder="Find restaurants, dishes or cuisines..."
          placeholderTextColor={forest.muted}
          value={query} onChangeText={setQuery}
          onSubmitEditing={search} returnKeyType="search"
          clearButtonMode="while-editing"
          style={h.searchInput}
        />
        <Pressable onPress={search} accessibilityRole="button"
          accessibilityLabel="Search menus" style={h.searchTap}>
          <Icon name="arrow-forward" color={forest.green} size={19} />
        </Pressable>
      </View>

      <View style={h.hero}>
        <Image source={require("../assets/home/chipotle-vegetarian-bowl.webp")}
          contentFit="cover" style={h.heroFood}
          accessibilityLabel="Vegetarian bowl with rice, beans, vegetables and guacamole" />
        <View style={h.heroMask} />
        <View style={h.heroText}>
          <Text accessibilityRole="header" style={h.heroTitle}>
            Reduce dietary mix-ups before you order.
          </Text>
          <Text style={h.heroSub}>
            Share your dietary needs with staff and review published menu information.
          </Text>
          <Pressable onPress={() => navigate("explore")}
            accessibilityRole="button" accessibilityLabel="Explore restaurant menus"
            style={({ pressed }) => [h.heroButton, pressed && h.pressed]}>
            <Text style={h.heroButtonLabel}>Explore menus</Text>
            <Icon name="arrow-forward" size={18} color={forest.ink} />
          </Pressable>
        </View>
      </View>

      <View style={h.section}>
        <View style={h.sectionHeading}>
          <Text accessibilityRole="header" style={h.sectionTitle}>Featured menus</Text>
          <Pressable onPress={() => navigate("explore")} accessibilityRole="button"
            accessibilityLabel="Browse all restaurants" style={h.textButton}>
            <Text style={h.link}>See all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={h.featureRail}>
          {featured.slice(0, 3).map((restaurant) => featureTile(restaurant))}
        </ScrollView>
        {!featured.length && <Text style={h.meta}>Browse Explore to see available restaurant menus.</Text>}
      </View>

      {featured.length > 3 && (
        <View style={h.section}>
          <View style={h.sectionHeading}>
            <Text accessibilityRole="header" style={h.sectionTitle}>More to explore</Text>
            <Pressable onPress={() => navigate("explore")} style={h.textButton}
              accessibilityRole="button" accessibilityLabel="Open all restaurant menus">
              <Text style={h.link}>See all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={h.moreRail}>
            {featured.slice(3).map((restaurant) => featureTile(restaurant, true))}
          </ScrollView>
        </View>
      )}

      <Pressable style={h.needs} onPress={() => navigate("edit-profile?returnTo=home")}
        accessibilityRole="button" accessibilityLabel="View or edit dietary needs">
        <View style={h.needsHeading}>
          <Icon name="shield-checkmark-outline" color={forest.lightText} size={24} />
          <Text style={h.needsTitle}>Your dietary needs</Text>
          <Icon name="chevron-forward" size={19} color={forest.lightText} />
        </View>
        <Text style={h.needsText}>
          {needs.length ? needs.map((need) => need.label).join(" · ")
            : "Add allergies and restrictions to personalize menu comparisons."}
        </Text>
        <Text style={h.needsFootnote}>Always confirm ingredients and cross-contact with restaurant staff.</Text>
      </Pressable>

      <View style={h.bottomActions}>
        <Pressable onPress={() => navigate("explore?location=1")}
          accessibilityRole="button" accessibilityLabel={`Change search area: ${location}`}
          style={h.locationButton}>
          <Icon name="location-outline" size={18} color={forest.green} />
          <Text style={h.locationText} numberOfLines={1}>{location}</Text>
          <Icon name="chevron-down" size={16} color={forest.muted} />
        </Pressable>
        <Pressable onPress={() => navigate("scan")} accessibilityRole="button"
          accessibilityLabel="Scan a menu" style={h.scanButton}>
          <Icon name="scan-outline" size={21} color={forest.green} />
          <Text style={h.scanText}>Scan menu</Text>
          <Icon name="arrow-forward" size={16} color={forest.green} />
        </Pressable>
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  header: { width:"100%", maxWidth:760, alignSelf:"center", flexDirection:"row",
    alignItems:"center", justifyContent:"space-between", paddingHorizontal:20,
    paddingVertical:9, backgroundColor:forest.background },
  brandLink: { flexDirection:"row", alignItems:"center", gap:6, minHeight:46 },
  brandMark: { width:28, height:36, resizeMode:"contain" },
  wordmark: { fontFamily:"HomeMedium", fontWeight:"500", fontSize:25,
    lineHeight:34, letterSpacing:-0.8, color:forest.ink },
  headerActions: { flexDirection:"row", alignItems:"center", gap:2 },
  iconButton: { width:42, height:44, alignItems:"center", justifyContent:"center" },
  profileButton: { width:43, height:43, borderRadius:22, backgroundColor:forest.surface,
    alignItems:"center", justifyContent:"center" },
  page: { gap:21, paddingBottom:18 },
  search: { minHeight:48, borderRadius:25, paddingLeft:15, paddingRight:4,
    backgroundColor:forest.surface, flexDirection:"row", gap:9, alignItems:"center" },
  searchInput: { flex:1, minWidth:0, fontSize:13, minHeight:47, color:forest.ink },
  searchTap: { width:44, height:44, alignItems:"center", justifyContent:"center" },
  hero: { minHeight:275, borderRadius:23, backgroundColor:forest.green, overflow:"hidden",
    position:"relative", justifyContent:"center" },
  heroFood: { position:"absolute", right:-39, top:0, bottom:0, height:"100%", width:"64%" },
  heroMask: { position:"absolute", top:0, bottom:0, left:0, width:"54%",
    backgroundColor:forest.green },
  heroText: { maxWidth:"71%", minHeight:268, paddingVertical:20, paddingLeft:19,
    paddingRight:6, justifyContent:"space-between", gap:11 },
  heroTitle: { fontFamily:"HomeHeadingStrong", fontSize:29, lineHeight:32,
    letterSpacing:-0.9, color:forest.lightText },
  heroSub: { fontSize:12, lineHeight:17, maxWidth:235, color:"#E4EBE2" },
  heroButton: { flexDirection:"row", gap:9, alignItems:"center", justifyContent:"center",
    borderRadius:24, minHeight:45, paddingHorizontal:13,
    backgroundColor:forest.lightText, alignSelf:"flex-start" },
  heroButtonLabel: { fontSize:13, fontWeight:"700", color:forest.ink },
  section: { gap:10 },
  sectionHeading: { flexDirection:"row", alignItems:"center",
    justifyContent:"space-between", gap:12 },
  sectionTitle: { color:forest.ink, fontSize:19, lineHeight:25, fontWeight:"700" },
  textButton: { minHeight:44, paddingHorizontal:4, alignItems:"center", justifyContent:"center" },
  link: { color:forest.ink, fontSize:13, fontWeight:"600" },
  featureRail: { gap:10, paddingRight:4 },
  featureTile: { width:132, backgroundColor:forest.card, borderRadius:17, overflow:"hidden" },
  featurePhotoFrame: { height:133, width:"100%", backgroundColor:forest.surface,
    alignItems:"center", justifyContent:"center" },
  foodPhoto: { width:"100%", height:"100%" },
  featureCaption: { minHeight:43, flexDirection:"row", gap:3,
    backgroundColor:forest.green, alignItems:"center", paddingHorizontal:9 },
  featureName: { flex:1, fontSize:12, lineHeight:16, fontWeight:"600", color:forest.lightText },
  moreRail: { gap:10, paddingRight:4 },
  moreTile: { width:168, borderRadius:15, backgroundColor:forest.card, overflow:"hidden" },
  morePhotoFrame: { height:110, backgroundColor:forest.surface },
  moreCaption: { paddingHorizontal:10, paddingVertical:9, minHeight:43 },
  moreName: { color:forest.ink, fontSize:13, fontWeight:"600" },
  meta: { color:forest.muted, fontSize:13, lineHeight:20 },
  needs: { backgroundColor:forest.green, borderRadius:18,
    padding:19, gap:10 },
  needsHeading: { flexDirection:"row", alignItems:"center", gap:9 },
  needsTitle: { color:forest.lightText, fontSize:18, flex:1, fontWeight:"700" },
  needsText: { color:forest.lightText, fontSize:13, lineHeight:20 },
  needsFootnote: { color:"#CADAD0", fontSize:11, lineHeight:17 },
  bottomActions: { flexDirection:"row", gap:10, flexWrap:"wrap" },
  locationButton: { flex:1, minWidth:125, flexDirection:"row", borderRadius:16,
    backgroundColor:forest.cardMuted, minHeight:50, paddingHorizontal:11,
    gap:7, alignItems:"center" },
  locationText: { flex:1, fontSize:12, color:forest.ink, fontWeight:"600" },
  scanButton: { flexDirection:"row", borderRadius:16, paddingHorizontal:14, minHeight:50,
    backgroundColor:forest.card, gap:7, alignItems:"center" },
  scanText: { fontSize:12, fontWeight:"600", color:forest.green },
  homeTab: { minWidth:56, minHeight:52, borderRadius:26,
    justifyContent:"center", alignItems:"center", gap:4 },
  homeTabSelected: { backgroundColor:forest.greenRaised },
  tabLabel: { color:forest.muted, fontSize:11 },
  pressed: { opacity:0.8, transform:[{scale:0.985}] },
});

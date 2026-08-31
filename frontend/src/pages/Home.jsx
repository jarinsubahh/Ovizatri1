import React from 'react'
import Hero from '../components/home/Hero'
import SearchBar from '../components/home/SearchBar'
import TopDestinations from '../components/home/TopDestinations'
import FeaturedPackages from '../components/home/FeaturedPackages'
import StatsBar from '../components/home/StatsBar'
import ClosingMessage from '../components/home/ClosingMessage'

export default function Home() {
  return (
    <>
      <Hero />
      <SearchBar />
      <TopDestinations />
      <FeaturedPackages />
      <StatsBar />
      <ClosingMessage />
    </>
  )
}
"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Menu, Network, BarChart3, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { useSidebarToggle } from "@/components/SidebarToggleContext";

const Index = () => {
  const { openSidebar } = useSidebarToggle();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white/10 backdrop-blur-md shadow-xl ring-1 ring-white/20 p-8 md:p-12 text-white">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={openSidebar}
              className="bg-white/90 text-teal-700 hover:bg-white hover:text-teal-800 border-0 shadow-md"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-wide bg-gradient-to-r from-white via-teal-100 to-teal-200 bg-clip-text text-transparent">
                Aplikasi Unit Cost RS
              </h1>
              <p className="mt-2 text-white/90 text-sm md:text-base max-w-2xl">
                Aplikasi Penghitungan Integratif, Analitik, dan Rasional Unit Cost
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/data-master/unit-kerja">
                  <Button className="bg-teal-600 hover:bg-teal-500 text-white shadow-md">Mulai dari Data Master</Button>
                </Link>
                <Link to="/rekapitulasi-unit-cost">
                  <Button variant="secondary" className="bg-white/90 text-teal-700 hover:bg-white shadow-md">Rekapitulasi Unit Cost</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-gradient-to-br from-white/30 to-white/10 p-6 ring-1 ring-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg">
                  <Network className="h-10 w-10 text-white" />
                </div>
                <div className="text-xl font-bold text-white">Integratif</div>
              </div>
              <div className="text-base text-white/90 leading-relaxed">
                Input dan Kalkulasi Integratif
              </div>
            </div>
            
            <div className="rounded-2xl bg-gradient-to-br from-white/30 to-white/10 p-6 ring-1 ring-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-800 shadow-lg">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div className="text-xl font-bold text-white">Analitik</div>
              </div>
              <div className="text-base text-white/90 leading-relaxed">
                Konsep Activity Based Costing Double Distribution
              </div>
            </div>
            
            <div className="rounded-2xl bg-gradient-to-br from-white/30 to-white/10 p-6 ring-1 ring-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg">
                  <Scale className="h-10 w-10 text-white" />
                </div>
                <div className="text-xl font-bold text-white">Rasional</div>
              </div>
              <div className="text-sm text-white/90 leading-relaxed">
                Pengambilan Keputusan Berbasis Data
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/20">
          <img
            src="/hero-ekosistem.jpg"
            alt=""
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="mt-8 flex justify-center">
          <MadeWithDyad />
        </div>
      </div>
    </div>
  );
};

export default Index;
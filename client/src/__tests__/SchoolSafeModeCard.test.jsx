import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SchoolSafeModeCard from '../components/school/SchoolSafeModeCard';
import { AirQualityProvider } from '../context/AirQualityContext';
import { SimulationProvider } from '../context/SimulationContext';

function renderCard(ui) {
  return render(
    <SimulationProvider>
      <AirQualityProvider>
        {ui}
      </AirQualityProvider>
    </SimulationProvider>
  );
}

describe('SchoolSafeModeCard Contrast & Render', () => {
  it('renders school safety card with high-contrast text and guidelines', () => {
    const { container } = renderCard(<SchoolSafeModeCard />);

    // School Name
    expect(screen.getByText(/Higher Secondary School/i)).toBeInTheDocument();

    // Section title
    expect(screen.getByText(/Campus Activity Guidelines/i)).toBeInTheDocument();

    // Check titles
    expect(screen.getByText('Morning Assembly')).toBeInTheDocument();
    expect(screen.getByText('Physical Education & Sports')).toBeInTheDocument();
    expect(screen.getByText('Outdoor Recess & Lunch')).toBeInTheDocument();
    expect(screen.getByText('Classroom Windows & Ventilation')).toBeInTheDocument();

    // Check Allowed and Restricted badges exist
    const badges = screen.getAllByText(/Allowed|Restricted/i);
    expect(badges.length).toBeGreaterThanOrEqual(4);

    // Verify title elements use text-slate-900 (light) and dark:text-slate-200
    const morningAssemblyTitle = screen.getByText('Morning Assembly');
    expect(morningAssemblyTitle.className).toContain('text-slate-900');
    expect(morningAssemblyTitle.className).toContain('dark:text-slate-200');

    // Verify detail description text uses text-slate-600 (light) and dark:text-slate-300
    const detailParagraph = screen.getByText(/Hold assembly inside classrooms/i);
    expect(detailParagraph.className).toContain('text-slate-600');
    expect(detailParagraph.className).toContain('dark:text-slate-300');

    // Verify badges have light contrast classes and dark mode tokens
    const allowedBadges = screen.getAllByText('Allowed');
    expect(allowedBadges.length).toBeGreaterThan(0);
    expect(allowedBadges[0].className).toContain('text-emerald-800');
    expect(allowedBadges[0].className).toContain('bg-emerald-100');
    expect(allowedBadges[0].className).toContain('dark:text-emerald-300');

    // Verify school title has text-slate-900 and dark:text-slate-100
    const schoolName = screen.getByText(/Higher Secondary School/i);
    expect(schoolName.className).toContain('text-slate-900');
    expect(schoolName.className).toContain('dark:text-slate-100');

    // Verify compliance footer
    expect(screen.getByText(/Compliant with National School Air Safety Standards/i)).toBeInTheDocument();
  });
});

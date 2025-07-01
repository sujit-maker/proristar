import React from 'react';
import ContainerLeaseTariffPage from './ContainerTable';
import SidebarWithHeader from '@/app/components/Sidebar';

export default function Customers() {
  return (
    <SidebarWithHeader>
      <ContainerLeaseTariffPage />
    </SidebarWithHeader>
  );
}
import React from 'react';
import { CrmWorkspace } from '../../crm/pages/CrmWorkspace';

export const AdminCustomersPage: React.FC = () => {
  return <CrmWorkspace initialView="overview" isStandalone={false} currentUserRole="admin" />;
};

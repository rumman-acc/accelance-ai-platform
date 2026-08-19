import{W as a,N as o}from"./index-BfPs_hYf.js";/**
 * @license @tabler/icons-react v3.31.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var d=a("outline","user","IconUser",[["path",{d:"M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0",key:"svg-0"}],["path",{d:"M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",key:"svg-1"}]]);const n=e=>o.get(`/role?organizationId=${e}`),r=e=>o.get(`/auth/roles/${e}`),s=e=>o.post("/role",e),l=e=>o.put("/role",e),c=e=>o.get(`/auth/roles/name/${e}`),i=(e,t)=>o.delete(`/role?id=${e}&organizationId=${t}`),p={getAllRolesByOrganizationId:n,getRoleById:r,createRole:s,updateRole:l,getRoleByName:c,deleteRole:i};export{d as I,p as r};

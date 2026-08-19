import{r as n,j as e}from"./code-editor-cLD96s78.js";import{k as Ee,b as ae,m as dt,H as we,D as $e,h as Te,i as Le,f as T,aa as lt,c as L,d as ze,ab as ct,Y as ut,u as pt,r as Ie,l as ht,a as mt,_ as ft,M as xt,B as gt,S as jt,a8 as yt,G as kt,s as Ct,t as bt,v as Dt,w as re,x as vt,ac as Ne,p as St,q as wt}from"./index-BfPs_hYf.js";import{h as ne,a5 as W,ak as It,ap as _e,a8 as _t,T as Q,r as Pe,E as N,S as U,Z as E,s as ie,J as D,a3 as Me,I as oe,P as At,O as Rt,H as Et,A as $t,a4 as Tt,ah as Ae,Y as w}from"./data-grid-gH2S7mw4.js";import{D as Lt,A as zt,a as Nt}from"./DeleteDocStoreDialog-Vu3_LvYP.js";import{B as Pt}from"./BackdropLoader-zaKyG0BM.js";import{d as z}from"./documentstore-CEEM1dwB.js";import{I as Mt}from"./IconSearch-C40vZKgS.js";import{E as Ot}from"./ErrorBoundary-DnKkyTvO.js";import{V as Bt}from"./ViewHeader-CM6DGxdy.js";import{A as I}from"./available-Dv_UBBsY.js";import{u as Vt,C as Ft}from"./ConfirmDialog-CujYFopr.js";import{M as qt}from"./MemoizedReactMarkdown-CH3D1v22.js";import{T as Ut}from"./Table-CkAXbWak.js";import{d as Wt}from"./ExpandMore-CbNoJzLv.js";import{A as Ht,a as Gt,b as Jt}from"./AccordionSummary-qqfXqT2G.js";import{d as Oe}from"./KeyboardArrowDown-DB4_kGmS.js";import{d as Be}from"./Delete-Dcr8aQp_.js";import{d as Yt}from"./Edit-BgqnH3vb.js";import{i as H,r as G}from"./createSvgIcon-BkEiEMO_.js";import{I as Kt}from"./IconRefresh-BDkSP0P6.js";import{I as Re}from"./IconPlus-BsjjRg56.js";import"./nodes-CP5Uy-zh.js";import"./v4-BKT09osN.js";import"./IconAlertTriangle-CiDop1Q6.js";import"./Link-CP4Ll1Ec.js";import"./IconCopy-rDGiScGd.js";import"./StyledFab-KY5-6Jnp.js";import"./IconEdit-DLToEaeK.js";import"./IconDownload-DmWZERmR.js";import"./defineProperty-Do-E_eL6.js";import"./syntax-highlight-C8SFHf3u.js";import"./math-rendering-DHubLQPD.js";import"./index-D--Rb2MU.js";import"./TooltipWithParser-DB6yDp6v.js";const Ve=({show:o,dialogProps:r,onCancel:h,onDocLoaderSelected:j})=>{const $=document.getElementById("portal"),x=Ee(),p=ne(),[y,c]=n.useState(""),[u,C]=n.useState([]),a=ae(z.getDocumentLoaders),v=d=>{c(d)};function O(d){return d.name.toLowerCase().indexOf(y.toLowerCase())>-1}n.useEffect(()=>{r.documentLoaders&&C(r.documentLoaders)},[r]),n.useEffect(()=>{a.request()},[]),n.useEffect(()=>{a.data&&C(a.data)},[a.data]),n.useEffect(()=>(x(o?{type:dt}:{type:we}),()=>x({type:we})),[o,x]);const P=o?e.jsxs($e,{fullWidth:!0,maxWidth:"md",open:o,onClose:h,"aria-labelledby":"alert-dialog-title","aria-describedby":"alert-dialog-description",children:[e.jsx(Te,{sx:{fontSize:"1rem",p:3,pb:0},id:"alert-dialog-title",children:r.title}),e.jsxs(Le,{sx:{display:"flex",flexDirection:"column",gap:2,maxHeight:"75vh",position:"relative",px:3,pb:3},children:[e.jsx(W,{sx:{backgroundColor:p.palette.background.paper,pt:2,position:"sticky",top:0,zIndex:10},children:e.jsx(It,{sx:{width:"100%",pr:2,pl:2,position:"sticky"},id:"input-search-credential",value:y,onChange:d=>v(d.target.value),placeholder:"Search",startAdornment:e.jsx(_e,{position:"start",children:e.jsx(Mt,{stroke:1.5,size:"1rem",color:p.palette.grey[500]})}),endAdornment:e.jsx(_e,{position:"end",sx:{cursor:"pointer",color:p.palette.grey[500],"&:hover":{color:p.palette.grey[900]}},title:"Clear Search",children:e.jsx(T,{stroke:1.5,size:"1rem",onClick:()=>v(""),style:{cursor:"pointer"}})}),"aria-describedby":"search-helper-text",inputProps:{"aria-label":"weight"}})}),e.jsx(_t,{sx:{width:"100%",display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:2,py:0,zIndex:9,borderRadius:"10px",[p.breakpoints.down("md")]:{maxWidth:370}},children:[...u].filter(O).map(d=>e.jsxs(lt,{alignItems:"center",onClick:()=>j(d.name),sx:{border:1,borderColor:p.palette.divider,borderRadius:1,display:"flex",alignItems:"center",justifyContent:"start",textAlign:"left",gap:1,p:2},children:[e.jsx("div",{style:{width:50,height:50,borderRadius:"50%",backgroundColor:"white",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx("img",{style:{width:"100%",height:"100%",padding:7,borderRadius:"50%",objectFit:"contain"},alt:d.name,src:`${L}/api/node-icon/${d.name}`})}),e.jsx(Q,{children:d.label})]},d.name))})]})]}):null;return Pe.createPortal(P,$)};Ve.propTypes={show:N.bool,dialogProps:N.object,onCancel:N.func,onDocLoaderSelected:N.func};const Fe=({show:o,dialogProps:r,onCancel:h})=>{const[j,$]=n.useState({}),[x,p]=n.useState(""),y=ne(),c=ze(t=>t.customization),[u,C]=n.useState({}),a=ae(z.getDocumentStoreConfig),v=()=>`With the Upsert API, you can choose an existing document and reuse the same configuration for upserting.

\`\`\`python
import requests
import json

API_URL = "${L}/api/document-store/upsert/${r.storeId}"
API_KEY = "your_api_key_here"

# use form data to upload files
form_data = {
    "files": ('my-another-file.pdf', open('my-another-file.pdf', 'rb'))
}

body_data = {
    "docId": "${r.loaderId}",
    "metadata": {}, # Add additional metadata to the document chunks
    "replaceExisting": True, # Replace existing document with the new upserted chunks
    "createNewDocStore": False, # Create a new document store
    "loaderName": "Custom Loader Name", # Override the loader name
    "splitter": json.dumps({"config":{"chunkSize":20000}}) # Override existing configuration
    # "loader": "",
    # "vectorStore": "",
    # "embedding": "",
    # "recordManager": "",
    # "docStore": ""
}

headers = {
    "Authorization": f"Bearer {BEARER_TOKEN}"
}

def query(form_data):
    response = requests.post(API_URL, files=form_data, data=body_data, headers=headers)
    print(response)
    return response.json()

output = query(form_data)
print(output)
\`\`\`

\`\`\`javascript
// use FormData to upload files
let formData = new FormData();
formData.append("files", input.files[0]);
formData.append("docId", "${r.loaderId}");
formData.append("loaderName", "Custom Loader Name");
formData.append("splitter", JSON.stringify({"config":{"chunkSize":20000}}));
// Add additional metadata to the document chunks
formData.append("metadata", "{}");
// Replace existing document with the new upserted chunks
formData.append("replaceExisting", "true");
// Create a new document store
formData.append("createNewDocStore", "false");
// Override existing configuration
// formData.append("loader", "");
// formData.append("embedding", "");
// formData.append("vectorStore", "");
// formData.append("recordManager", "");
// formData.append("docStore", "");

async function query(formData) {
    const response = await fetch(
        "${L}/api/document-store/upsert/${r.storeId}",
        {
            method: "POST",
            headers: {
                "Authorization": "Bearer <your_api_key_here>"
            },
            body: formData
        }
    );
    const result = await response.json();
    return result;
}

query(formData).then((response) => {
    console.log(response);
});
\`\`\`

\`\`\`bash
curl -X POST ${L}/api/document-store/upsert/${r.storeId} \\
  -H "Authorization: Bearer <your_api_key_here>" \\
  -F "files=@<file-path>" \\
  -F "docId=${r.loaderId}" \\
  -F "loaderName=Custom Loader Name" \\
  -F "splitter={"config":{"chunkSize":20000}}" \\
  -F "metadata={}" \\
  -F "replaceExisting=true" \\
  -F "createNewDocStore=false" \\
  # Override existing configuration:
  # -F "loader=" \\
  # -F "embedding=" \\
  # -F "vectorStore=" \\
  # -F "recordManager=" \\
  # -F "docStore="
\`\`\`
`,O=()=>`With the Upsert API, you can choose an existing document and reuse the same configuration for upserting.
 
\`\`\`python
import requests

API_URL = "${L}/api/document-store/upsert/${r.storeId}"
API_KEY = "your_api_key_here"

headers = {
    "Authorization": f"Bearer {BEARER_TOKEN}"
}

def query(payload):
    response = requests.post(API_URL, json=payload, headers=headers)
    return response.json()

output = query({
    "docId": "${r.loaderId}",
    "metadata": "{}", # Add additional metadata to the document chunks
    "replaceExisting": True, # Replace existing document with the new upserted chunks
    "createNewDocStore": False, # Create a new document store
    "loaderName": "Custom Loader Name", # Override the loader name
    # Override existing configuration
    "loader": {
        "config": {
            "text": "This is a new text"
        }
    },
    "splitter": {
        "config": {
            "chunkSize": 20000
        }
    },
    # embedding: {},
    # vectorStore: {},
    # recordManager: {}
    # docStore: {}
})
print(output)
\`\`\`

\`\`\`javascript
async function query(data) {
    const response = await fetch(
        "${L}/api/document-store/upsert/${r.storeId}",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer <your_api_key_here>"
            },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}

query({
    "docId": "${r.loaderId}",
    "metadata": "{}", // Add additional metadata to the document chunks
    "replaceExisting": true, // Replace existing document with the new upserted chunks
    "createNewDocStore": false, // Create a new document store
    "loaderName": "Custom Loader Name", // Override the loader name
    // Override existing configuration
    "loader": {
        "config": {
            "text": "This is a new text"
        }
    },
    "splitter": {
        "config": {
            "chunkSize": 20000
        }
    },
    // embedding: {},
    // vectorStore: {},
    // recordManager: {}
    // docStore: {}
}).then((response) => {
    console.log(response);
});
\`\`\`

\`\`\`bash
curl -X POST ${L}/api/document-store/upsert/${r.storeId} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_api_key_here>" \\
  -d '{
        "docId": "${r.loaderId}",
        "metadata": "{}",
        "replaceExisting": true,
        "createNewDocStore": false,
        "loaderName": "Custom Loader Name",
        "loader": {
            "config": {
                "text": "This is a new text"
            }
        },
        "splitter": {
            "config": {
                "chunkSize": 20000
            }
        }
        // Override existing configuration
        // "embedding": {},
        // "vectorStore": {},
        // "recordManager": {}
        // "docStore": {}
      }'

\`\`\`
`,P=t=>{const m={},_=new Set;let A=!1;t.forEach(R=>{const{node:b,nodeId:Y,label:Z,name:V,type:M}=R;V==="files"&&(A=!0),_.add(b),m[b]||(m[b]={nodeIds:[],params:[]}),m[b].nodeIds.includes(Y)||m[b].nodeIds.push(Y);const K={label:Z,name:V,type:M};m[b].params.some(X=>JSON.stringify(X)===JSON.stringify(K))||m[b].params.push(K)});for(const R in m)m[R].nodeIds.sort();$(m),p(A?v():O())},d=t=>(m,_)=>{const A={...u};A[t]=_,C(A)};n.useEffect(()=>{a.data&&P(a.data)},[a.data]),n.useEffect(()=>{o&&r&&a.request(r.storeId,r.loaderId)},[o,r]);const J=document.getElementById("portal"),B=o?e.jsxs($e,{onClose:h,open:o,fullWidth:!0,maxWidth:"lg","aria-labelledby":"alert-dialog-title","aria-describedby":"alert-dialog-description",children:[e.jsx(Te,{sx:{fontSize:"1rem"},id:"alert-dialog-title",children:r.title}),e.jsxs(Le,{children:[e.jsxs(W,{sx:{display:"flex",alignItems:"center",padding:2,mb:3,background:c.isDarkMode?"linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.1) 100%)":"linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)",color:c.isDarkMode?"white":"#333333",fontWeight:400,borderRadius:1,border:`1px solid ${c.isDarkMode?"rgba(33, 150, 243, 0.3)":"rgba(33, 150, 243, 0.2)"}`,gap:1.5},children:[e.jsx(ct,{size:20,style:{color:c.isDarkMode?"#64b5f6":"#1976d2",flexShrink:0}}),e.jsxs(W,{sx:{flex:1},children:[e.jsx("strong",{children:"Note:"})," Upsert API can only be used when the existing document loader has been upserted before."]})]}),e.jsx(qt,{children:x}),e.jsx(Q,{sx:{mt:3,mb:1},children:"You can override existing configurations:"}),e.jsx(U,{direction:"column",spacing:2,sx:{width:"100%",my:2},children:e.jsx(ut,{sx:{borderColor:y.palette.primary[200]+75,p:2},variant:"outlined",children:Object.keys(j).sort().map(t=>e.jsxs(Ht,{expanded:u[t]||!1,onChange:d(t),disableGutters:!0,children:[e.jsx(Gt,{expandIcon:e.jsx(Wt,{}),"aria-controls":`nodes-accordian-${t}`,id:`nodes-accordian-header-${t}`,children:e.jsxs(U,{flexDirection:"row",sx:{gap:2,alignItems:"center",flexWrap:"wrap"},children:[e.jsx(Q,{variant:"h5",children:t}),j[t].nodeIds.length>0&&j[t].nodeIds.map((m,_)=>e.jsx("div",{style:{display:"flex",flexDirection:"row",width:"max-content",borderRadius:15,background:"rgb(254,252,191)",padding:5,paddingLeft:10,paddingRight:10},children:e.jsx("span",{style:{color:"rgb(116,66,16)",fontSize:"0.825rem"},children:m})},_))]})}),e.jsx(Jt,{children:e.jsx(Ut,{rows:j[t].params.map(m=>{const{node:_,nodeId:A,...R}=m;return R}),columns:Object.keys(j[t].params[0]).slice(-3)})})]},t))})})]})]}):null;return Pe.createPortal(B,J)};Fe.propTypes={show:N.bool,dialogProps:N.object,onCancel:N.func};var de={},Xt=H;Object.defineProperty(de,"__esModule",{value:!0});var le=de.default=void 0,Qt=Xt(G()),Zt=e,es=(0,Qt.default)((0,Zt.jsx)("path",{d:"M10 4h4v4h-4zM4 16h4v4H4zm0-6h4v4H4zm0-6h4v4H4zm10 8.42V10h-4v4h2.42zm6.88-1.13-1.17-1.17c-.16-.16-.42-.16-.58 0l-.88.88L20 12.75l.88-.88c.16-.16.16-.42 0-.58zM11 18.25V20h1.75l6.67-6.67-1.75-1.75zM16 4h4v4h-4z"}),"AppRegistration");le=de.default=es;var ce={},ts=H;Object.defineProperty(ce,"__esModule",{value:!0});var ue=ce.default=void 0,ss=ts(G()),os=e,as=(0,ss.default)((0,os.jsx)("path",{d:"M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"}),"NoteAdd");ue=ce.default=as;var pe={},rs=H;Object.defineProperty(pe,"__esModule",{value:!0});var qe=pe.default=void 0,ns=rs(G()),is=e,ds=(0,ns.default)((0,is.jsx)("path",{d:"M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"}),"Search");qe=pe.default=ds;var he={},ls=H;Object.defineProperty(he,"__esModule",{value:!0});var Ue=he.default=void 0,cs=ls(G()),us=e,ps=(0,cs.default)((0,us.jsx)("path",{d:"M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"}),"Refresh");Ue=he.default=ps;var me={},hs=H;Object.defineProperty(me,"__esModule",{value:!0});var We=me.default=void 0,ms=hs(G()),fs=e,xs=(0,ms.default)((0,fs.jsx)("path",{d:"M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"}),"Code");We=me.default=xs;const gs="/assets/doc_store_details_empty-B8g8M--k.svg",g=ie(Tt)(({theme:o})=>({borderColor:o.palette.divider,padding:"6px 16px",[`&.${Ae.head}`]:{color:o.palette.grey[900]},[`&.${Ae.body}`]:{fontSize:14,height:64}})),js=ie(re)(()=>({"&:last-child td, &:last-child th":{border:0}})),He=ie(o=>e.jsx(Et,{elevation:0,anchorOrigin:{vertical:"bottom",horizontal:"right"},transformOrigin:{vertical:"top",horizontal:"right"},...o}))(({theme:o})=>({"& .MuiPaper-root":{borderRadius:6,marginTop:o.spacing(1),minWidth:180,boxShadow:"rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px","& .MuiMenu-list":{padding:"4px 0"},"& .MuiMenuItem-root":{"& .MuiSvgIcon-root":{fontSize:18,color:o.palette.text.secondary,marginRight:o.spacing(1.5)},"&:active":{backgroundColor:$t(o.palette.primary.main,o.palette.action.selectedOpacity)}}}})),eo=()=>{var Ce,be,De,ve;const o=ne(),r=ze(s=>s.customization),h=pt(),j=Ee(),{hasAssignedWorkspace:$}=Ie();ht();const{confirm:x}=Vt(),p=(...s)=>j(St(...s)),y=(...s)=>j(wt(...s)),{error:c,setError:u}=mt(),{hasPermission:C}=Ie(),a=ae(z.getSpecificDocumentStore),[v,O]=n.useState(!0),[P,d]=n.useState(!1),[J,B]=n.useState(!1),[t,m]=n.useState({}),[_,A]=n.useState({}),[R,b]=n.useState(!1),[Y,Z]=n.useState({}),[V,M]=n.useState(!1),[K,X]=n.useState({}),[fe,xe]=n.useState(!1),[Je,Ye]=n.useState({}),[ge,ee]=n.useState(null),te=!!ge,{storeId:S}=ft(),Ke=s=>{h("/document-stores/"+S+"/"+s)},je=s=>{h("/document-stores/chunks/"+S+"/"+s)},Xe=s=>{h("/document-stores/query/"+s)},Qe=s=>{b(!1),h("/document-stores/"+S+"/"+s)},Ze=s=>{h("/document-stores/vector/"+s)},ye=()=>{Z({title:"Select Document Loader"}),b(!0)},ke=async(s,l)=>{try{await z.deleteVectorStoreDataFromStore(s,l)}catch(i){console.error(i)}},et=async(s,l)=>{if(d(!0),M(!1),s==="STORE"){t.recordManagerConfig&&await ke(S);try{const i=await z.deleteDocumentStore(S);d(!1),i.data&&(p({message:"Store, Loader and associated document chunks deleted",options:{key:new Date().getTime()+Math.random(),variant:"success",action:f=>e.jsx(E,{style:{color:"white"},onClick:()=>y(f),children:e.jsx(T,{})})}}),h("/document-stores/"))}catch(i){d(!1),u(i),p({message:`Failed to delete Document Store: ${typeof i.response.data=="object"?i.response.data.message:i.response.data}`,options:{key:new Date().getTime()+Math.random(),variant:"error",persist:!0,action:f=>e.jsx(E,{style:{color:"white"},onClick:()=>y(f),children:e.jsx(T,{})})}})}}else if(s==="LOADER"){t.recordManagerConfig&&await ke(S,l.id);try{const i=await z.deleteLoaderFromStore(S,l.id);d(!1),i.data&&(p({message:"Loader and associated document chunks deleted",options:{key:new Date().getTime()+Math.random(),variant:"success",action:f=>e.jsx(E,{style:{color:"white"},onClick:()=>y(f),children:e.jsx(T,{})})}}),se())}catch(i){u(i),d(!1),p({message:`Failed to delete Document Loader: ${typeof i.response.data=="object"?i.response.data.message:i.response.data}`,options:{key:new Date().getTime()+Math.random(),variant:"error",persist:!0,action:f=>e.jsx(E,{style:{color:"white"},onClick:()=>y(f),children:e.jsx(T,{})})}})}}},tt=(s,l,i)=>{const f=s.loaderName||"Unknown";let k="";s.files&&Array.isArray(s.files)&&s.files.length>0?k=s.files.map(it=>it.name).join(", "):s.source&&(typeof s.source=="string"&&s.source.includes("base64")?k=Ne(s.source):typeof s.source=="string"&&s.source.startsWith("[")&&s.source.endsWith("]")?k=JSON.parse(s.source).join(", "):typeof s.source=="string"&&(k=s.source));const q=k?`${f} (${k})`:f;let Se=`Delete "${q}"? This will delete all the associated document chunks from the document store.`;i&&l&&Object.keys(i).length>0&&Object.keys(l).length>0&&(Se=`Delete "${q}"? This will delete all the associated document chunks from the document store and remove the actual data from the vector store database.`),X({title:"Delete",description:Se,vectorStoreConfig:l,recordManagerConfig:i,type:"LOADER",file:s}),M(!0)},st=(s,l)=>{var k,q;let i=`Delete Store ${(k=a.data)==null?void 0:k.name}? This will delete all the associated loaders and document chunks from the document store.`;l&&s&&Object.keys(l).length>0&&Object.keys(s).length>0&&(i=`Delete Store ${(q=a.data)==null?void 0:q.name}? This will delete all the associated loaders and document chunks from the document store, and remove the actual data from the vector store database.`),X({title:"Delete",description:i,vectorStoreConfig:s,recordManagerConfig:l,type:"STORE"}),M(!0)},ot=async s=>{if(await x({title:"Refresh all loaders and upsert all chunks?",description:"This will re-process all loaders and upsert all chunks. This action might take some time.",confirmButtonName:"Refresh",cancelButtonName:"Cancel"})){ee(null),d(!0);try{(await z.refreshLoader(s)).data&&p({message:"Document store refresh successfully!",options:{key:new Date().getTime()+Math.random(),variant:"success",action:k=>e.jsx(E,{style:{color:"white"},onClick:()=>y(k),children:e.jsx(T,{})})}}),d(!1)}catch(f){d(!1),p({message:`Failed to refresh document store: ${typeof f.response.data=="object"?f.response.data.message:f.response.data}`,options:{key:new Date().getTime()+Math.random(),variant:"error",action:k=>e.jsx(E,{style:{color:"white"},onClick:()=>y(k),children:e.jsx(T,{})})}})}}},at=()=>{const l={title:"Edit Document Store",type:"EDIT",cancelButtonName:"Cancel",confirmButtonName:"Update",data:{name:t.name,description:t.description,id:t.id}};A(l),B(!0)},se=()=>{B(!1),a.request(S)},rt=s=>{s.preventDefault(),s.stopPropagation(),ee(s.currentTarget)},nt=(s,l)=>{Ye({title:"Upsert API",storeId:s,loaderId:l}),xe(!0)},F=()=>{ee(null)};return n.useEffect(()=>{a.request(S)},[]),n.useEffect(()=>{if(a.data){const s=a.data.workspaceId;if(!$(s)){h("/unauthorized");return}m(a.data)}},[a.data]),n.useEffect(()=>{O(a.loading)},[a.loading]),e.jsxs(e.Fragment,{children:[e.jsx(xt,{children:c?e.jsx(Ot,{error:c}):e.jsxs(U,{flexDirection:"column",sx:{gap:3},children:[e.jsxs(Bt,{isBackButton:!0,isEditButton:C("documentStores:create,documentStores:update"),search:!1,title:t==null?void 0:t.name,description:t==null?void 0:t.description,onBack:()=>h("/document-stores"),onEdit:()=>at(),children:[((t==null?void 0:t.status)==="STALE"||(t==null?void 0:t.status)==="UPSERTING")&&e.jsx(gt,{permissionId:"documentStores:view",onClick:se,size:"small",color:"primary",title:"Refresh Document Store",children:e.jsx(Kt,{})}),e.jsx(jt,{permissionId:"documentStores:add-loader",variant:"contained",sx:{ml:2,minWidth:200,height:"100%",color:"white"},startIcon:e.jsx(Re,{}),onClick:ye,children:"Add Document Loader"}),e.jsx(E,{id:"document-store-header-action-button","aria-controls":te?"document-store-header-menu":void 0,"aria-haspopup":"true","aria-expanded":te?"true":void 0,variant:"outlined",disableElevation:!0,color:"primary",onClick:rt,sx:{minWidth:150},endIcon:e.jsx(Oe,{}),children:"More Actions"}),e.jsxs(He,{id:"document-store-header-menu",MenuListProps:{"aria-labelledby":"document-store-header-menu-button"},anchorEl:ge,open:te,onClose:F,children:[e.jsxs(D,{disabled:(t==null?void 0:t.totalChunks)<=0||(t==null?void 0:t.status)==="UPSERTING",onClick:()=>{F(),je("all")},disableRipple:!0,children:[e.jsx(le,{}),"View & Edit Chunks"]}),e.jsx(I,{permission:"documentStores:upsert-config",children:e.jsxs(D,{disabled:(t==null?void 0:t.totalChunks)<=0||(t==null?void 0:t.status)==="UPSERTING",onClick:()=>{F(),Ze(t.id)},disableRipple:!0,children:[e.jsx(ue,{}),"Upsert All Chunks"]})}),e.jsxs(D,{disabled:(t==null?void 0:t.totalChunks)<=0||(t==null?void 0:t.status)!=="UPSERTED",onClick:()=>{F(),Xe(t.id)},disableRipple:!0,children:[e.jsx(qe,{}),"Retrieval Query"]}),e.jsx(I,{permission:"documentStores:upsert-config",children:e.jsxs(D,{disabled:(t==null?void 0:t.totalChunks)<=0||(t==null?void 0:t.status)!=="UPSERTED",onClick:()=>ot(t.id),disableRipple:!0,title:"Re-process all loaders and upsert all chunks",children:[e.jsx(Ue,{}),"Refresh"]})}),e.jsx(Me,{sx:{my:.5}}),e.jsxs(D,{onClick:()=>{F(),st(t.vectorStoreConfig,t.recordManagerConfig)},disableRipple:!0,children:[e.jsx(Be,{}),"Delete"]})]})]}),e.jsx(Lt,{status:t==null?void 0:t.status}),((be=(Ce=a.data)==null?void 0:Ce.whereUsed)==null?void 0:be.length)>0&&e.jsxs(U,{flexDirection:"row",sx:{gap:2,alignItems:"center",flexWrap:"wrap"},children:[e.jsxs("div",{style:{paddingLeft:"15px",paddingRight:"15px",paddingTop:"10px",paddingBottom:"10px",fontSize:"0.9rem",width:"max-content",display:"flex",flexDirection:"row",alignItems:"center"},children:[e.jsx(yt,{style:{marginRight:5},size:17}),"Chatflows Used:"]}),a.data.whereUsed.map((s,l)=>e.jsx(oe,{clickable:!0,style:{width:"max-content",borderRadius:"25px",boxShadow:r.isDarkMode?"0 2px 14px 0 rgb(255 255 255 / 10%)":"0 2px 14px 0 rgb(32 40 45 / 10%)"},label:s.name,onClick:()=>h("/canvas/"+s.id)},l))]}),!v&&t&&!((De=t==null?void 0:t.loaders)!=null&&De.length)?e.jsxs(U,{sx:{alignItems:"center",justifyContent:"center"},flexDirection:"column",children:[e.jsx(W,{sx:{p:2,height:"auto"},children:e.jsx("img",{style:{objectFit:"cover",height:"16vh",width:"auto"},src:gs,alt:"doc_store_details_emptySVG"})}),e.jsx("div",{children:"No Document Added Yet"}),e.jsx(kt,{variant:"contained",sx:{height:"100%",mt:2,color:"white"},startIcon:e.jsx(Re,{}),onClick:ye,children:"Add Document Loader"})]}):e.jsx(Ct,{sx:{border:1,borderColor:o.palette.divider,borderRadius:1},component:At,children:e.jsxs(bt,{sx:{minWidth:650},"aria-label":"simple table",children:[e.jsx(Dt,{sx:{backgroundColor:r.isDarkMode?o.palette.common.black:o.palette.grey[100],height:56},children:e.jsxs(re,{children:[e.jsx(g,{children:" "}),e.jsx(g,{children:"Loader"}),e.jsx(g,{children:"Splitter"}),e.jsx(g,{children:"Source(s)"}),e.jsx(g,{children:"Chunks"}),e.jsx(g,{children:"Chars"}),e.jsx(I,{permission:"documentStores:preview-process,documentStores:delete-loader",children:e.jsx(g,{children:"Actions"})})]})}),e.jsx(vt,{children:v?e.jsx(js,{children:e.jsx(g,{colSpan:C("documentStores:preview-process,documentStores:delete-loader")?7:6,sx:{border:0},children:e.jsx(W,{display:"flex",alignItems:"center",justifyContent:"center",sx:{py:6},children:e.jsx(Rt,{})})})}):e.jsx(e.Fragment,{children:(t==null?void 0:t.loaders)&&(t==null?void 0:t.loaders.length)>0&&(t==null?void 0:t.loaders.map((s,l)=>e.jsx(Ge,{index:l,loader:s,theme:o,onEditClick:()=>Ke(s.id),onViewChunksClick:()=>je(s.id),onDeleteClick:()=>tt(s,t==null?void 0:t.vectorStoreConfig,t==null?void 0:t.recordManagerConfig),onChunkUpsert:()=>h(`/document-stores/vector/${t.id}/${s.id}`),onViewUpsertAPI:()=>nt(t.id,s.id)},l)))})})]})}),((ve=a.data)==null?void 0:ve.status)==="STALE"&&e.jsx("div",{style:{width:"100%",textAlign:"center",marginTop:"20px"},children:e.jsx(Q,{color:"warning",style:{color:"darkred",fontWeight:500,fontStyle:"italic",fontSize:12},children:"Some files are pending processing. Please Refresh to get the latest status."})})]})}),J&&e.jsx(zt,{dialogProps:_,show:J,onCancel:()=>B(!1),onConfirm:se}),R&&e.jsx(Ve,{show:R,dialogProps:Y,onCancel:()=>b(!1),onDocLoaderSelected:Qe}),V&&e.jsx(Nt,{show:V,dialogProps:K,onCancel:()=>M(!1),onDelete:et}),fe&&e.jsx(Fe,{show:fe,dialogProps:Je,onCancel:()=>xe(!1)}),P&&e.jsx(Pt,{open:P}),e.jsx(Ft,{})]})};function Ge(o){var y;const[r,h]=n.useState(null),j=!!r,$=c=>{c.preventDefault(),c.stopPropagation(),h(c.currentTarget)},x=()=>{h(null)},p=(c,u,C)=>{let a="";return c&&Array.isArray(c)&&c.length>0?a=c.map(v=>v.name).join(", "):u&&typeof u=="string"&&u.includes("base64")?a=Ne(u):u&&typeof u=="string"&&u.startsWith("[")&&u.endsWith("]")?a=JSON.parse(u).join(", "):u&&(a=u),a?C?`${C} (${a})`:a:C||"No source"};return e.jsx(e.Fragment,{children:e.jsxs(re,{hover:!0,sx:{"&:last-child td, &:last-child th":{border:0},cursor:"pointer"},children:[e.jsx(g,{onClick:o.onViewChunksClick,scope:"row",style:{width:"5%"},children:e.jsx("div",{style:{display:"flex",width:"20px",height:"20px",backgroundColor:((y=o.loader)==null?void 0:y.status)==="SYNC"?"#00e676":"#ffe57f",borderRadius:"50%"}})}),e.jsx(g,{onClick:o.onViewChunksClick,scope:"row",children:o.loader.loaderName}),e.jsx(g,{onClick:o.onViewChunksClick,children:o.loader.splitterName??"None"}),e.jsx(g,{onClick:o.onViewChunksClick,children:p(o.loader.files,o.loader.source)}),e.jsx(g,{onClick:o.onViewChunksClick,children:o.loader.totalChunks&&e.jsx(oe,{variant:"outlined",size:"small",label:o.loader.totalChunks.toLocaleString()})}),e.jsx(g,{onClick:o.onViewChunksClick,children:o.loader.totalChars&&e.jsx(oe,{variant:"outlined",size:"small",label:o.loader.totalChars.toLocaleString()})}),e.jsx(I,{permission:"documentStores:preview-process,documentStores:delete-loader",children:e.jsx(g,{children:e.jsxs("div",{children:[e.jsx(E,{id:"document-store-action-button","aria-controls":j?"document-store-action-customized-menu":void 0,"aria-haspopup":"true","aria-expanded":j?"true":void 0,disableElevation:!0,onClick:c=>$(c),endIcon:e.jsx(Oe,{}),children:"Options"}),e.jsxs(He,{id:"document-store-actions-customized-menu",MenuListProps:{"aria-labelledby":"document-store-actions-customized-button"},anchorEl:r,open:j,onClose:x,children:[e.jsx(I,{permission:"documentStores:preview-process",children:e.jsxs(D,{onClick:()=>{x(),o.onEditClick()},disableRipple:!0,children:[e.jsx(Yt,{}),"Preview & Process"]})}),e.jsx(I,{permission:"documentStores:preview-process",children:e.jsxs(D,{onClick:()=>{x(),o.onViewChunksClick()},disableRipple:!0,children:[e.jsx(le,{}),"View & Edit Chunks"]})}),e.jsx(I,{permission:"documentStores:preview-process",children:e.jsxs(D,{onClick:()=>{x(),o.onChunkUpsert()},disableRipple:!0,children:[e.jsx(ue,{}),"Upsert Chunks"]})}),e.jsx(I,{permission:"documentStores:preview-process",children:e.jsxs(D,{onClick:()=>{x(),o.onViewUpsertAPI()},disableRipple:!0,children:[e.jsx(We,{}),"View API"]})}),e.jsx(Me,{sx:{my:.5}}),e.jsx(I,{permission:"documentStores:delete-loader",children:e.jsxs(D,{onClick:()=>{x(),o.onDeleteClick()},disableRipple:!0,children:[e.jsx(Be,{}),"Delete"]})})]})]})})})]},o.index)})}Ge.propTypes={loader:w.any,index:w.number,open:w.bool,theme:w.any,onViewChunksClick:w.func,onEditClick:w.func,onDeleteClick:w.func,onChunkUpsert:w.func,onViewUpsertAPI:w.func};export{eo as default};

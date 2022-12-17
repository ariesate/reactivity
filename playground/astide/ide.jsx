import React, {createElement, Fragment, useState, useEffect, useRef, useLayoutEffect} from 'react'
import ReactDOM from "react-dom/client";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import FormControl from "@mui/material/FormControl";
import DialogTitle from "@mui/material/DialogTitle";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
import Rbac from "@build-security/react-rbac-ui-manager";

import EditorJS from '@editorjs/editorjs';
import Checklist from '@editorjs/checklist';
import List from '@editorjs/list';
import Table from '@editorjs/table';

import Quill from 'quill'


import {
    createMuiTheme,
    ThemeProvider,
    withStyles
} from "@material-ui/core/styles";

import AssignmentIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'

import Parser from "./Parser";
import codeText from './test.js?raw'
import {Generator} from "./codegenDOM";
import './Editor.less'

const parser = new Parser()


const ast = parser.parse(codeText)
const generator = new Generator()


function AuthTablePlaceholder() {
    const [anchorEl, setAnchorEl] = useState(null)
    const [rbacData, setRbacData] = React.useState({});

    const handleRbacChange = (value) => {
        setRbacData(value);
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;


    const [showAuthTable, setShowAuthTable] = useState(false)


    if(showAuthTable) {
        const theme = createMuiTheme({
            palette: {
                primary: {
                    main: "#4994E4",
                    light: "#3C74C3"
                },
                info: {
                    main: "#D6EBFF"
                },
                text: {
                    primary: "#363C44"
                }
            },
            overrides: {
                MuiTableCell: {
                    root: {
                        fontSize: "14px",
                        padding: "5px 15px",
                        borderBottom: 0
                    }
                }
            }
        });
        const data = {
            _roles: {
                user: {
                    permissions: []
                },
                admin: {
                    permissions: []
                },
            },
            _resources: {
                documents: {
                    name: "Documents",
                    _resources: {
                        "documents.upload": {
                            name: "upload",
                            _resources: {}
                        },
                        "documents.create": {
                            name: "create",
                            _resources: {}
                        },
                    }
                },
            }
        };
        return (
            <ThemeProvider theme={theme}>
                <div style={{background:"#8fa4cb" ,display:"block"}} contentEditable={false}>
                    <Badge badgeContent={<Avatar sx={{ bgcolor: '#5ad82c',width: 15, height: 15 }} onClick={() => setShowAuthTable(false)}>
                        <CloseIcon sx={{width: 11, height: 11}}/>
                    </Avatar>} >
                        <Rbac
                            defaultValue={data}
                            onChange={handleRbacChange}
                        />
                    </Badge>

                </div>
            </ThemeProvider>
        )
    }


    return (
       <>
           <Badge badgeContent={<Avatar sx={{ bgcolor: '#5ad82c',width: 15, height: 15 }} onClick={handleClick}>
               <AssignmentIcon sx={{width: 11, height: 11}}/>
           </Avatar>} >
               <inline data-type="NewExpression">
                   <keyword>new</keyword>
                   <space> </space>
                   <identifier data-type="Identifier">AuthTable</identifier>
                   <frag>
                       <boundary start="true">(</boundary>
                       {JSON.stringify(rbacData)}
                       <boundary end="true">)</boundary>
                   </frag>
               </inline>
           </Badge>
           <Popover
               id={id}
               open={open}
               anchorEl={anchorEl}
               onClose={handleClose}
               anchorOrigin={{
                   vertical: 'bottom',
                   horizontal: 'right',
               }}
           >
               <div>
                   <Tooltip title="该节点已注册可视组件，可切换">
                       <Button variant="text" onClick={() => { setShowAuthTable(true); handleClose() }}>转换成组件</Button>
                   </Tooltip>
                   <Tooltip title="导出到本项目协作工作台，可实现双向编辑">
                       <Button variant="text">导出到协作工作台</Button>
                   </Tooltip>
               </div>
           </Popover>
       </>
    )
}


function DatePlaceholder() {
    const [anchorEl, setAnchorEl] = useState(null)
    const [openAlert, setOpenAlert] = React.useState(false);
    const [openDialog, setOpenDialog] = React.useState(false);
    const handleOpenAlert = () => {
        setOpenAlert(true)
    }

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    return (
        <>
            <Badge badgeContent={<Avatar sx={{ bgcolor: '#5ad82c',width: 15, height: 15 }} onClick={handleClick}>
                <AssignmentIcon sx={{width: 11, height: 11}}/>
            </Avatar>} >
                <inline data-type="NewExpression">
                    <keyword>new</keyword>
                    <space> </space>
                    <identifier data-type="Identifier">Date</identifier>
                </inline>
            </Badge>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                <div>
                    <Tooltip title="该节点已注册可视组件，可切换">
                        <Button variant="text">转换成组件</Button>
                    </Tooltip>
                    <Tooltip title="导出到本项目协作工作台，可实现双向编辑">
                        <Button variant="text" onClick={() => {setOpenDialog(true);setAnchorEl(null)}}>导出到协作工作台</Button>
                    </Tooltip>
                </div>
            </Popover>
            <Snackbar open={openAlert} autoHideDuration={2000} onClose={() => setOpenAlert(false)} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    导出成功
                </Alert>
            </Snackbar>
            <Dialog open={openDialog} >
                <DialogTitle>导出到协作工作台</DialogTitle>
                <div style={{padding:10}}>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Age</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={10}
                            label="分类"
                        >
                            <MenuItem value={10}>基础配置</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{marginY:4}}>
                        <TextField
                            required
                            id="outlined-required"
                            label="配置项名称"
                        />
                    </FormControl>
                    <Button variant="contained" onClick={() => { setOpenAlert(true); setOpenDialog(false)}}>确定</Button>
                </div>


            </Dialog>
        </>
    )
}


function RichText() {
    const ref = useRef()
    useLayoutEffect(() => {
        console.log(ref.current)
        // setTimeout(() => {
        //     const editor = new EditorJS({
        //         holder: ref.current,
        //         tools: {
        //             table: {
        //                 class: Table,
        //                 inlineToolbar: true,
        //                 config: {
        //                     rows: 2,
        //                     cols: 3,
        //                 },
        //             },
        //             list: List,
        //             checklist: Checklist
        //         },
        //     });
        // },500)
        new Quill(ref.current, {
            theme: 'snow'
        });

    })

    return <div  contentEditable={false} style={{all:"unset",color:'#333',background:'#fff', marginBottom:50, height:300,display:'block',position:'relative'}}>
        <div ref={ref}></div>
    </div>

}


function App() {
    const ref = useRef()
    useEffect(() => {
        const result = generator.generate(ast, ({ node, vnode }) => {
            if (node.type === 'NewExpression' && node.callee.name === 'AuthTable') {
                vnode.innerHTML = ''
                ReactDOM.createRoot(vnode).render(
                    <AuthTablePlaceholder />
                )
                console.log(node, node.callee.name === 'AuthTable', vnode)
            } else if (node.type === 'NewExpression' && node.callee.name === 'Date') {
                vnode.innerHTML = ''
                ReactDOM.createRoot(vnode).render(
                    <DatePlaceholder />
                )
            } else if(node.type === 'VariableDeclaration' && node.kind==='var') {

                vnode.innerHTML = ''
                ReactDOM.createRoot(vnode).render(
                    <RichText />
                )
            }
            return vnode
        })
        ref.current.appendChild(result)
    })

    return <div ref={ref}></div>
}


ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)


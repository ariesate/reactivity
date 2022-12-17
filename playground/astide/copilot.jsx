import React, {createElement, Fragment, useState, useEffect, useRef} from 'react'
import ReactDOM from "react-dom/client";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


import Rbac from "@build-security/react-rbac-ui-manager";
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
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";

const parser = new Parser()


const ast = parser.parse(codeText)
const generator = new Generator()




function App() {
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

    const [date, setDate] = useState()
    const [dirty, setDirty] = useState(false)
    const handleChangeDate = (newDate) => {

        setDate(newDate)
        setOpenAlert(true)
        setDirty(true)
    }

    const [openAlert, setOpenAlert] = React.useState(false);

    const [openDialog, setOpenDialog] = React.useState(false);

    return (
        <div>
            <h1>运营活动平台</h1>
            <h2>基础权限表</h2>
            <ThemeProvider theme={theme}>
                <div style={{background:"#ffffff" ,display:"block"}} contentEditable={false}>
                    <Rbac
                        defaultValue={data}
                    />
                </div>
            </ThemeProvider>
            <h2>权限到期日</h2>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                    label="权限到期日"
                    inputFormat="YYYY/MM/DD"
                    value={date}
                    onChange={handleChangeDate}
                    renderInput={(params) => <TextField {...params} />}
                />
            </LocalizationProvider>
            <Snackbar open={openAlert} autoHideDuration={2000} onClose={() => setOpenAlert(false)} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    成功
                </Alert>
            </Snackbar>
            <Dialog open={openDialog} >
                <DialogTitle>提交修改</DialogTitle>
                <div style={{padding:10}}>
                    <div style={{marginBottom:10}}>
                        <Alert severity="info">
                            commit: "setting: 修改'权限到期日'"
                        </Alert>

                    </div>
                    <Button variant="contained" onClick={() => { setOpenAlert(true); setOpenDialog(false)}}>确定</Button>
                </div>
            </Dialog>
            <Divider sx={{marginY:4}}/>
            <div>
                <Button variant={dirty? 'contained' : 'outlined'} onClick={() => setOpenDialog(true)}>提交</Button>
            </div>
            <div>

                <span>
                    <span>before block asdfasdfasdfa</span>
                    <div>test block</div>
                    <span>after block asdfasdfasdfa</span>
                </span>
                <span>
                    <span>before block asdfasdfasdfa</span>
                    <div>test block</div>
                    <span>after block asdfasdfasdfa</span>
                </span>
            </div>

        </div>
    )
}


ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)


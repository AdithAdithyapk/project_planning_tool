import React, { useState, useEffect } from 'react';
import EnhancedTableHead from './EnhancedTableHead';
import TableNoData from './table-no-data';
import { getComparator, applyFilter } from '../../../utilities/sorting';
import { Box, Paper, Table, TableContainer, TableBody, TablePagination, TableRow, TableCell } from '@mui/material';
import BpCheckbox from '../../../utilities/BpCheckbox';
import { Draggable } from 'react-beautiful-dnd';
import Collapsible from "../collapse/Collapsible";
import "../../../styles/collapsible.css";
import axios from "axios";
import DeleteTicketModal from "../collapse/DeleteModal";
import IssuePopup from "../../issueView/IssuePopup";

function EnhancedTable({ header, data, setData, placeholder, setPage, page, filterName }) {
  const [selected, setSelected] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ticketIdsToDelete, setTicketIdsToDelete] = useState([]);
  const [showIssuePopup, setShowIssuePopup] = useState(false);
  const [popupIssueId, setPopupIssueId] = useState(null);
  const [forceBoardRefresh, setForceBoardRefresh] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
  }, [data]);


  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((task) => (task.id).toString());
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const refreshBoard = () => {
    setForceBoardRefresh(!forceBoardRefresh);
  };

  const handleDoubleClick = (event, id) => {
    setShowIssuePopup(true);
    setPopupIssueId(id);
  }

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = () => {
    if (selected.length > 0) {
      setTicketIdsToDelete(selected);
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteItems = async (selectedIds) => {
    // const selectedIds = [...selected];
    try {
      await Promise.all(selectedIds.map(async (id) => {
        await axios.delete(`http://localhost:3009/api/issues/${id}`);
      }));
      const updatedData = data.filter((row) => !selectedIds.includes((row.id).toString()));
      setData(updatedData);
      setSelected([]);
    } catch (error) {
      console.error('Error deleting selected objects:', error);
    }
    setDeleteModalOpen(false);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  const dataFiltered = applyFilter({
    inputData: data,
    filterName,
  });
  const notFound = !dataFiltered.length && !!filterName;
  return (
    <Box sx={{ width: '100%' }}  >
      <Collapsible open header={header} onDelete={handleDelete} numSelected={selected.length}>
        <Paper sx={{ width: '100%' }}>
          <DeleteTicketModal
            open={isDeleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onTicketDelete={handleDeleteItems}
            ticketIds={ticketIdsToDelete}
          />

          <TableContainer>
            <Table
              sx={{ minWidth: 750 }}
              aria-labelledby="tableTitle"
              size='small'
            >
              <EnhancedTableHead
                numSelected={selected.length}
                onSelectAllClick={handleSelectAllClick}
                rowCount={data.length}
                header={header}
              />
              <TableBody  
>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const isItemSelected = isSelected((row.id).toString());
                    const labelId = `enhanced-table-checkbox-${index}`;
                    // Check if the row status allows dragging
                    const canDrag = row.status === 'To Do' || row.status === 'Backlog';
                    return (
                      <React.Fragment key={row.id}>
                        {canDrag ? (
                          <Draggable key={(row.id).toString()} draggableId={(row.id).toString()} index={index}>
                            {(provided) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                hover
                                onClick={(event) => handleClick(event, (row.id).toString())}
                                onDoubleClick={(event) => handleDoubleClick(event, (row.id).toString())}
                                role="checkbox"
                                aria-checked={isItemSelected}
                                tabIndex={-1}
                                key={row.id}
                                selected={isItemSelected}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell padding="checkbox">
                                  <BpCheckbox isItemSelected={isItemSelected} isCustomized={false} />
                                </TableCell>
                                <TableCell component="th" id={labelId} scope="row" padding="none">
                                  <span style={{ textDecoration: row.status === 'done' && row.completedInPreviousSprint ? 'line-through' : 'none' }}>
                                    {row.ticketName}
                                  </span>
                                </TableCell>
                                <TableCell align="left">{row.title}</TableCell>
                                <TableCell align="left">{row.status}</TableCell>
                                <TableCell align="left">{row.priority}</TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ) : (
                          // Render the row without Draggable component if dragging is not allowed
                          <TableRow
                            hover
                            onClick={(event) => handleClick(event, (row.id).toString())}
                            onDoubleClick={(event) => handleDoubleClick(event, (row.id).toString())}
                            role="checkbox"
                            aria-checked={isItemSelected}
                            tabIndex={-1}
                            key={row.id}
                            selected={isItemSelected}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <BpCheckbox isItemSelected={isItemSelected} isCustomized={false} />
                            </TableCell>
                            <TableCell component="th" id={labelId} scope="row" padding="none">
                              <span style={{ textDecoration: row.status === 'Done' && row.completedInPreviousSprint ? 'line-through' : 'none' }}>
                                {row.ticketName}
                              </span>
                            </TableCell>
                            <TableCell align="left"> <span style={{ textDecoration: row.status === 'Done' && row.completedInPreviousSprint ? 'line-through' : 'none' }}>
                              {row.title}
                            </span></TableCell>
                            <TableCell align="left">{row.status}</TableCell>
                            <TableCell align="left">{row.priority}</TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                }

                {placeholder}
                {notFound && <TableNoData query={filterName} />}

              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />

        </Paper>
        {showIssuePopup && (
          <IssuePopup
            refreshBoard={refreshBoard}
            issueId={popupIssueId}
            onClose={() => {
              setShowIssuePopup(false);
            }}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          />
        )}
      </Collapsible>
    </Box>


  );
}

export default EnhancedTable;



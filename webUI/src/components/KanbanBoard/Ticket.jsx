import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import './Board.css';
import DeleteTicketModal from './DeleteModal';

const Ticket = (props) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ticket',
    item: {
      type: 'ticket',
      id: props.ticket.id,
      status: props.ticket.status,
      index: props.index,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [showFullName, setShowFullName] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleMouseEnter = (e) => {
    e.target.className === 'assignee-image'
      ? setShowFullName(true)
      : setIsHovered(true);
  };

  const handleMouseLeave = (e) => {
    e.target.className === 'assignee-image'
      ? setShowFullName(false)
      : setIsHovered(false);
    setShowFullName(false);
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_TICKET_API_ENDPOINT}issues/${id}`
      );
      if (!response?.data) {
        console.log('Deleting ticket with ID:', props.ticket.id);
      }
      props.setTickets(response.data);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  return (
    <>
      <Card
        data-testid={`ticket-${props.ticket.ticketName}`}
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
          marginBottom: '10px',
          position: 'relative',
          transition: 'opacity 0.3s',
          backgroundColor: isHovered ? 'lightgray' : '',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          props.openPopupWithIssue(props.ticket.id);
        }}
      >
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setDeleteModalOpen(true);
          }}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            color: 'gray',
          }}
          data-testid='delete-ticket-icon'
        >
          <Delete sx={{ fontSize: 'large' }} />
        </IconButton>

        <CardContent>
          <Typography
            variant='body'
            component='h5'
            style={{ fontWeight: 400, color: 'black' }}
          >
            {props.ticket.title}
          </Typography>
          <Typography
            variant='body'
            component='h5'
            style={{ fontWeight: 'bold', color: 'gray', marginTop: '10px' }}
          >
            {props.ticket.ticketName}
          </Typography>
          <Tooltip
            data-testid='tooltip-assignee'
            title={props.ticket.assignee}
            open={showFullName}
            onClose={() => setShowFullName(false)}
            arrow
          >
            <div
              className='assignee-image'
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {props.assigneeInitials}
            </div>
          </Tooltip>
          <div
            className={
              'estimate' +
              (props.ticket.status === 'In Progress'
                ? ' inprogress'
                : props.ticket.status === 'Done'
                ? ' done'
                : '')
            }
          >
            {props.ticket.estimate}
          </div>
        </CardContent>
      </Card>

      <DeleteTicketModal
        open={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onTicketDelete={handleDelete}
        ticketId={props.ticket.id}
        ticketName={props.ticket.ticketName}
      />
    </>
  );
};

export default Ticket;

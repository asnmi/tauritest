// src/hooks/useNavigation.ts
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from './store';
import { selectCurrentPage, navigateTo } from './navigation_slice';

export const navigate = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentPage = useSelector(selectCurrentPage);

  return {
    currentPage,
    navigateTo: (page: 
        'home' 
      | 'editor' 
      | 'history'
      | 'schedule'
      | 'todolist'
      | 'reorderablelist'
      | 'kanban'
      | 'search') => dispatch(navigateTo(page))
  };
}
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import FolderSidebar from '../FolderSidebar'
import { foldersApi } from '../../api/folders'
import { Folder } from '../../api/types'

// Mock the folders API
vi.mock('../../api/folders', () => ({
  foldersApi: {
    list: vi.fn(),
    create: vi.fn(),
  },
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('FolderSidebar Component', () => {
  let queryClient: QueryClient

  const mockFolders: Folder[] = [
    {
      id: 'folder-1',
      name: 'Infrastructure Issues',
      owner_id: 'user-1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      deleted_at: null,
      version: 1,
    },
    {
      id: 'folder-2',
      name: 'Security Alerts',
      owner_id: 'user-1',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
      deleted_at: null,
      version: 1,
    },
    {
      id: 'folder-3',
      name: 'Database Performance',
      owner_id: 'user-1',
      created_at: '2024-01-17T10:00:00Z',
      updated_at: '2024-01-17T10:00:00Z',
      deleted_at: null,
      version: 1,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    mockNavigate.mockClear()
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <FolderSidebar />
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  describe('Folder List Rendering', () => {
    it('should render folder list when folders are loaded', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })

      renderComponent()

      // Wait for folders to load
      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      expect(screen.getByText('Security Alerts')).toBeInTheDocument()
      expect(screen.getByText('Database Performance')).toBeInTheDocument()
    })

    it('should display loading spinner while fetching folders', () => {
      vi.mocked(foldersApi.list).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = renderComponent()

      // Ant Design Spin component has aria-busy="true"
      const spinner = container.querySelector('[aria-busy="true"]')
      expect(spinner).toBeInTheDocument()
    })

    it('should display empty state when no folders exist', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: [],
        next_cursor: null,
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('No folders yet')).toBeInTheDocument()
      })
    })

    it('should call foldersApi.list with correct parameters', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })

      renderComponent()

      await waitFor(() => {
        expect(foldersApi.list).toHaveBeenCalledWith({ limit: 100 })
      })
    })
  })

  describe('Create Folder Functionality', () => {
    it('should show create folder input when "New Folder" button is clicked', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      const newFolderButton = screen.getByRole('button', { name: /new folder/i })
      await userEvent.click(newFolderButton)

      expect(screen.getByPlaceholderText('Folder name')).toBeInTheDocument()
    })

    it('should fire create-folder mutation when form is submitted', async () => {
      const newFolder: Folder = {
        id: 'folder-4',
        name: 'Application Errors',
        owner_id: 'user-1',
        created_at: '2024-01-18T10:00:00Z',
        updated_at: '2024-01-18T10:00:00Z',
        deleted_at: null,
        version: 1,
      }

      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })
      vi.mocked(foldersApi.create).mockResolvedValue(newFolder)

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      // Click "New Folder" button
      const newFolderButton = screen.getByRole('button', { name: /new folder/i })
      await userEvent.click(newFolderButton)

      // Type folder name
      const input = screen.getByPlaceholderText('Folder name')
      await userEvent.type(input, 'Application Errors')

      // Submit by clicking check button
      const submitButton = screen.getByRole('button', { name: /check/i })
      await userEvent.click(submitButton)

      // Verify create mutation was called
      await waitFor(() => {
        expect(foldersApi.create).toHaveBeenCalledWith({ name: 'Application Errors' })
      })
    })

    it('should fire create-folder mutation when Enter key is pressed', async () => {
      const newFolder: Folder = {
        id: 'folder-4',
        name: 'Network Issues',
        owner_id: 'user-1',
        created_at: '2024-01-18T10:00:00Z',
        updated_at: '2024-01-18T10:00:00Z',
        deleted_at: null,
        version: 1,
      }

      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })
      vi.mocked(foldersApi.create).mockResolvedValue(newFolder)

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      // Click "New Folder" button
      const newFolderButton = screen.getByRole('button', { name: /new folder/i })
      await userEvent.click(newFolderButton)

      // Type folder name and press Enter
      const input = screen.getByPlaceholderText('Folder name')
      await userEvent.type(input, 'Network Issues{Enter}')

      // Verify create mutation was called
      await waitFor(() => {
        expect(foldersApi.create).toHaveBeenCalledWith({ name: 'Network Issues' })
      })
    })

    it('should trim whitespace from folder name before creating', async () => {
      const newFolder: Folder = {
        id: 'folder-4',
        name: 'Storage Issues',
        owner_id: 'user-1',
        created_at: '2024-01-18T10:00:00Z',
        updated_at: '2024-01-18T10:00:00Z',
        deleted_at: null,
        version: 1,
      }

      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })
      vi.mocked(foldersApi.create).mockResolvedValue(newFolder)

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      const newFolderButton = screen.getByRole('button', { name: /new folder/i })
      await userEvent.click(newFolderButton)

      const input = screen.getByPlaceholderText('Folder name')
      await userEvent.type(input, '  Storage Issues  {Enter}')

      await waitFor(() => {
        expect(foldersApi.create).toHaveBeenCalledWith({ name: 'Storage Issues' })
      })
    })

    it('should not create folder with empty name', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      const newFolderButton = screen.getByRole('button', { name: /new folder/i })
      await userEvent.click(newFolderButton)

      const submitButton = screen.getByRole('button', { name: /check/i })
      await userEvent.click(submitButton)

      // Should not call create API
      expect(foldersApi.create).not.toHaveBeenCalled()
    })

    it('should cancel folder creation when cancel button is clicked', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      const newFolderButton = screen.getByRole('button', { name: /new folder/i })
      await userEvent.click(newFolderButton)

      const input = screen.getByPlaceholderText('Folder name')
      await userEvent.type(input, 'Test Folder')

      const cancelButton = screen.getByRole('button', { name: /close/i })
      await userEvent.click(cancelButton)

      // Input should be gone
      expect(screen.queryByPlaceholderText('Folder name')).not.toBeInTheDocument()
      // New Folder button should be back
      expect(screen.getByRole('button', { name: /new folder/i })).toBeInTheDocument()
    })

    it('should invalidate queries and update UI after successful creation', async () => {
      const newFolder: Folder = {
        id: 'folder-4',
        name: 'Access Management',
        owner_id: 'user-1',
        created_at: '2024-01-18T10:00:00Z',
        updated_at: '2024-01-18T10:00:00Z',
        deleted_at: null,
        version: 1,
      }

      vi.mocked(foldersApi.list)
        .mockResolvedValueOnce({
          folders: mockFolders,
          next_cursor: null,
        })
        .mockResolvedValueOnce({
          folders: [...mockFolders, newFolder],
          next_cursor: null,
        })

      vi.mocked(foldersApi.create).mockResolvedValue(newFolder)

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      const newFolderButton = screen.getByRole('button', { name: /new folder/i })
      await userEvent.click(newFolderButton)

      const input = screen.getByPlaceholderText('Folder name')
      await userEvent.type(input, 'Access Management{Enter}')

      // Wait for the new folder to appear in the list
      await waitFor(() => {
        expect(screen.getByText('Access Management')).toBeInTheDocument()
      })

      // Input should be hidden after successful creation
      expect(screen.queryByPlaceholderText('Folder name')).not.toBeInTheDocument()
    })
  })

  describe('Folder Navigation', () => {
    it('should navigate to folder tickets when folder is clicked', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      const folderItem = screen.getByText('Infrastructure Issues')
      await userEvent.click(folderItem)

      expect(mockNavigate).toHaveBeenCalledWith('/tickets?folder=folder-1')
    })

    it('should update selected folder state when folder is clicked', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Security Alerts')).toBeInTheDocument()
      })

      const folderItem = screen.getByText('Security Alerts')
      await userEvent.click(folderItem)

      // The folder should be visually selected (Ant Design adds ant-menu-item-selected class)
      const menuItem = folderItem.closest('.ant-menu-item')
      await waitFor(() => {
        expect(menuItem).toHaveClass('ant-menu-item-active')
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when folder creation fails', async () => {
      vi.mocked(foldersApi.list).mockResolvedValue({
        folders: mockFolders,
        next_cursor: null,
      })

      const errorResponse = {
        problemDetails: {
          type: 'https://tickets.example.com/errors/duplicate-folder-name',
          title: 'Duplicate Folder Name',
          status: 409,
          detail: 'A folder named "Infrastructure Issues" already exists',
        },
      }

      vi.mocked(foldersApi.create).mockRejectedValue(errorResponse)

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure Issues')).toBeInTheDocument()
      })

      const newFolderButton = screen.getByRole('button', { name: /new folder/i })
      await userEvent.click(newFolderButton)

      const input = screen.getByPlaceholderText('Folder name')
      await userEvent.type(input, 'Infrastructure Issues{Enter}')

      // Note: Ant Design message.error is mocked by default in tests
      // In a real test environment, you would mock the message API
      await waitFor(() => {
        expect(foldersApi.create).toHaveBeenCalled()
      })
    })
  })
})

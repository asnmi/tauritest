import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { FileText } from 'lucide-react';
import './homepage.css';
import { useFile } from './FileHooks';
import { getPagesByPath, PageJson } from '../database/usePageDatabase';


export default function Home() {
  const { openEditorWithUpdate } = useFile();
  const [pages, setPages] = useState<PageJson[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

    const{
      handleNewFile
    } = useFile();

  // Fetch pages on component mount
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const result = await getPagesByPath('home/');
        setPages(result);
      } catch (error) {
        console.error('Error fetching pages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  // Filter and sort recent files
  /*const recentFiles = useMemo(() => {
    return [...itemPage]
      .filter((item): item is any => {
        return item && 'filePath' in item && 'title' in item && 'timestamp' in item;
      })
      .sort((a, b) => {
        // Use lastOpened if it exists, otherwise use timestamp
        const timeA = a.timestamp;
        const timeB = b.timestamp;
        return timeB - timeA;  // Sort from newest to oldest
      })
      .slice(0, 10);
  }, [itemPage]);*/

  if (loading) {
    return (
      <div className="emptyState">
        <div className="emptyStateContent">
          <FileText className="emptyStateIcon" />
          <h2 className="emptyStateTitle">Chargement en cours...</h2>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="emptyState">
        <div className="emptyStateContent">
          <FileText className="emptyStateIcon" />
          <h2 className="emptyStateTitle">Aucun fichier récent</h2>
          <p className="emptyStateDescription">
            Commencez par ouvrir un fichier pour le voir apparaître ici
          </p>
          <Button 
            variant="default"
            onClick={() =>{
              handleNewFile();
            }
            }
          >
            Créer un nouveau document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Fichiers récents</h1>
        <Button 
          variant="default"
            onClick={() =>{
              handleNewFile();
            }
            }
        >
          Nouveau document
        </Button>
      </div>
      <div className="grid">
        {pages.map((page, index) => (
          <Card key={index} className="card" onClick={() => openEditorWithUpdate(page)}>
            <CardHeader className="cardHeader">
              <CardTitle className="cardTitle">
                <FileText className="cardIcon" />
                {page.title || 'Sans titre'}
              </CardTitle>
              <CardDescription className="cardDescription">
                {page.path && (
                  <div className="filePath">
                    {page.path}
                  </div>
                )}
                <div className="fileDate">
                  {formatDate(page.updated_at)}
                </div>
              </CardDescription>
            </CardHeader>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  openEditorWithUpdate(page);
                }}
              >
                Ouvrir
              </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
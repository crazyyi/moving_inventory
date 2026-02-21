# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img [ref=e4]
    - heading "Inventory Not Found" [level=2] [ref=e8]
    - paragraph [ref=e9]: The inventory you're looking for doesn't exist or has expired.
    - link "Back to Home" [ref=e10] [cursor=pointer]:
      - /url: /
  - generic:
    - status [ref=e16]: Network Error
    - status [ref=e22]: Network Error
  - generic [ref=e27] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e28]:
      - img [ref=e29]
    - generic [ref=e32]:
      - button "Open issues overlay" [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]: "0"
          - generic [ref=e36]: "1"
        - generic [ref=e37]: Issue
      - button "Collapse issues badge" [ref=e38]:
        - img [ref=e39]
  - alert [ref=e41]
```